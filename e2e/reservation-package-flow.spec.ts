import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * E2E complet du flow de réservation par pack/acompte :
 *  1) Formulaire d'acompte (page Contact) → vérifie que l'edge function
 *     `create-checkout` est appelée avec les bons paramètres et renvoie
 *     une URL Stripe Checkout (sans suivre la redirection externe).
 *  2) Espace client `/mon-espace` → saisie du code KP, réservation d'une
 *     session disponible, vérification du décrément des crédits puis
 *     annulation de la réservation.
 *
 * Pré-requis : un accès `psql` configuré (variables PG* dans la sandbox
 * Lovable Cloud). Le test est skip si psql n'est pas disponible.
 */

const TEST_CODE = `KP-TEST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
const TEST_EMAIL = `e2e+${Date.now()}@kitesurfpassion.test`;

function sql(query: string): string {
  const out = execSync('psql -At 2>&1', {
    input: query,
    encoding: 'utf8',
    shell: '/bin/bash',
  }).trim();
  if (/^ERROR/m.test(out)) {
    throw new Error(`psql error:\n${out}\nQuery: ${query}`);
  }
  // psql renvoie parfois "<value>\nINSERT 0 1" – on garde la 1re ligne
  return out.split('\n')[0].trim();
}

function psqlAvailable(): boolean {
  try {
    execSync('psql -At -c "select 1"', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test.describe('Flow réservation pack acompte', () => {
  test.skip(!psqlAvailable(), 'psql / PG* env not configured in this environment');

  let sessionId = '';
  let packageId = '';

  test.beforeAll(async () => {
    // Session ouverte dans 20–90 jours (au-delà du J-2 → annulation possible).
    // On essaie plusieurs créneaux pour contourner la contrainte unique
    // (date, time_slot, activity).
    const slots = ['morning', 'afternoon', 'full_day'];
    let lastErr: unknown = null;
    for (let i = 0; i < 20 && !sessionId; i++) {
      const offset = 20 + Math.floor(Math.random() * 70);
      const slot = slots[Math.floor(Math.random() * slots.length)];
      try {
        sessionId = sql(`
          INSERT INTO public.sessions (date, time_slot, activity, max_participants, status, notes)
          VALUES ((CURRENT_DATE + INTERVAL '${offset} days')::date, '${slot}', 'kitesurf', 4, 'open', 'e2e-${TEST_CODE}')
          RETURNING id;
        `);
      } catch (e) {
        lastErr = e;
      }
    }
    if (!sessionId) throw lastErr ?? new Error('Impossible de créer une session de test');

    packageId = sql(`
      INSERT INTO public.client_packages
        (package_code, email, first_name, last_name, phone, activity,
         package_type, total_sessions, used_sessions, status, deposit_amount,
         deposit_paid_at, expires_at)
      VALUES
        ('${TEST_CODE}', '${TEST_EMAIL}', 'E2E', 'Tester', '0612345678',
         'kitesurf', 'cours-particulier', 2, 0, 'active', 50,
         now(), now() + interval '90 days')
      RETURNING id;
    `);

    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(packageId).toMatch(/^[0-9a-f-]{36}$/);
  });

  test.afterAll(async () => {
    // NOTE: l'utilisateur psql sandbox n'a pas la permission DELETE.
    // Les données de test (suffixées par TEST_CODE) restent en base et seront
    // purgées via une migration de cleanup ou manuellement par l'admin.
  });

  test('1. Formulaire acompte appelle create-checkout et reçoit une URL Stripe', async ({ page }) => {
    // Intercepte l'appel à l'edge function pour ne pas réellement créer
    // de session Stripe ni quitter le domaine de test.
    let capturedPayload: any = null;
    await page.route('**/functions/v1/create-checkout', async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://checkout.stripe.com/c/pay/cs_test_FAKE_E2E_SESSION',
        }),
      });
    });

    await page.goto('/contact-reservation-kitesurf-hyeres');

    // Première carte = Cours Particulier Kitesurf
    const firstCard = page.locator('section >> text=Cours Particulier Kitesurf').first();
    await expect(firstCard).toBeVisible();
    const card = firstCard.locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');

    await card.getByPlaceholder('Jean Dupont').fill('E2E Tester');
    await card.getByPlaceholder('06 12 34 56 78').fill('0612345678');

    await card.getByRole('button', { name: /Choisir une date/i }).click();
    // Calendar (react-day-picker v8) : chaque jour est un <button name="day">
    await page.locator('button[name="day"]:not([disabled])').first().click();
    // Ferme la popover éventuellement ouverte
    await page.keyboard.press('Escape').catch(() => {});

    const payBtn = card.getByRole('button', { name: /Payer l'acompte/i });
    await payBtn.scrollIntoViewIfNeeded();
    await payBtn.click({ force: true });

    // Attend que l'edge function ait été appelée
    await expect.poll(() => capturedPayload, { timeout: 10_000 }).toBeTruthy();
    expect(capturedPayload).toMatchObject({
      activityName: expect.stringContaining('Cours Particulier'),
      participants: expect.any(Number),
      preferredDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      phone: '0612345678',
      customerName: 'E2E Tester',
    });
  });

  test('2. /mon-espace : code KP → réservation d\'une session → annulation', async ({ page }) => {
    await page.goto('/mon-espace');

    await page.getByPlaceholder('KP-2026-XXXX').fill(TEST_CODE);
    await page.getByRole('button', { name: /Accéder/i }).click();

    // Pack chargé : prénom + code visibles
    await expect(page.getByText('E2E Tester')).toBeVisible();
    await expect(page.getByText(TEST_CODE)).toBeVisible();

    // Crédits initiaux : "2 / 2" sessions restantes
    await expect(page.getByText(/sessions restantes/i)).toBeVisible();
    await expect(page.getByText('/ 2').first()).toBeVisible();

    // Trouve la carte de notre session seedée (date J+7) et clique Réserver
    const reserveBtn = page.getByRole('button', { name: /^Réserver$/ }).first();
    await expect(reserveBtn).toBeEnabled();
    await reserveBtn.click();

    // Toast succès + la session apparaît dans "Mes journées réservées"
    await expect(page.getByText(/Journée réservée/i)).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Mes journées réservées').locator('..').getByRole('button', { name: /Annuler/i }).first()
    ).toBeVisible();

    // Vérifie côté DB que used_sessions = 1
    const used = sql(`SELECT used_sessions FROM public.client_packages WHERE id = '${packageId}';`);
    expect(used).toBe('1');

    // Annulation (session future éloignée → annulation autorisée).
    // Scope au panneau "Mes journées réservées" pour ne pas cliquer un
    // bouton "Annuler" d'un toast / cookie banner.
    const bookedSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /Mes journées réservées/i }) });
    await bookedSection.getByRole('button', { name: /Annuler/i }).first().click();

    // Poll DB jusqu'à voir le décrément (toast peut disparaître trop vite)
    await expect
      .poll(
        () => sql(`SELECT used_sessions FROM public.client_packages WHERE id = '${packageId}';`),
        { timeout: 10_000, intervals: [500, 1000, 1500] },
      )
      .toBe('0');
  });
});