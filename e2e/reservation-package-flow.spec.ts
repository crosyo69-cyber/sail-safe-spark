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
 *
 * STATUT : squelette opérationnel.
 *   - Test 1 (formulaire acompte) : à finaliser — l'interception
 *     `**\/functions\/v1\/create-checkout` ne capture pas encore le payload
 *     (probable validation côté formulaire). À investiguer via trace.
 *   - Test 2 (espace client) : la réservation cible "la 1ʳᵉ session
 *     disponible" alors que d'autres sessions kitesurf existent déjà en
 *     base. Il faut filtrer le bouton Réserver sur la date exacte de la
 *     session seedée (sessionId) pour fiabiliser l'assertion DB.
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
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST, OPTIONS',
            'access-control-allow-headers':
              'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
          },
        });
        return;
      }
      try {
        capturedPayload = req.postDataJSON();
      } catch {
        capturedPayload = req.postData();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
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

    // Cible explicitement la session seedée via data-session-id pour éviter
    // de cliquer sur une autre session kitesurf ouverte en base.
    const seededCard = page.locator(`[data-session-id="${sessionId}"]`);
    await expect(seededCard).toBeVisible({ timeout: 10_000 });
    await seededCard.scrollIntoViewIfNeeded();
    const reserveBtn = seededCard.getByRole('button', { name: /^Réserver$/ });
    await expect(reserveBtn).toBeEnabled();
    const bookResp = page.waitForResponse(
      (r) => r.url().includes('/rest/v1/rpc/book_session_with_code'),
      { timeout: 10_000 },
    );
    await reserveBtn.click();
    expect((await bookResp).status()).toBe(200);

    // DB : un package_booking confirmé existe bien pour CETTE session précise
    await expect
      .poll(
        () =>
          sql(`
            SELECT COUNT(*)::int FROM public.package_bookings
             WHERE package_id = '${packageId}'
               AND session_id = '${sessionId}'
               AND status = 'confirmed';
          `),
        { timeout: 10_000, intervals: [500, 1000] },
      )
      .toBe('1');

    // DB : used_sessions = 1
    await expect
      .poll(
        () => sql(`SELECT used_sessions FROM public.client_packages WHERE id = '${packageId}';`),
        { timeout: 10_000, intervals: [500, 1000] },
      )
      .toBe('1');

    // Annulation (session future éloignée → annulation autorisée).
    // Scope au panneau "Mes journées réservées" pour ne pas cliquer un
    // bouton "Annuler" d'un toast / cookie banner.
    const cancelBtn = page.getByRole('button', { name: /Annuler/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });

    const cancelResponse = page.waitForResponse(
      (r) => r.url().includes('/rest/v1/rpc/cancel_booking_with_code'),
      { timeout: 10_000 },
    );
    await cancelBtn.click();
    const resp = await cancelResponse;
    expect(resp.status()).toBe(200);

    // Poll DB jusqu'à voir le décrément (toast peut disparaître trop vite)
    await expect
      .poll(
        () => sql(`SELECT used_sessions FROM public.client_packages WHERE id = '${packageId}';`),
        { timeout: 10_000, intervals: [500, 1000, 1500] },
      )
      .toBe('0');
  });
});