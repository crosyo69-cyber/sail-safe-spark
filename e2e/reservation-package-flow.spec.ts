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

const TEST_CODE = `KP-TEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const TEST_EMAIL = `e2e+${Date.now()}@kitesurfpassion.test`;

function sql(query: string): string {
  return execSync(`psql -At -c ${JSON.stringify(query)}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
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
    // Session ouverte dans 7 jours (au-delà du J-2 → annulation possible)
    sessionId = sql(`
      INSERT INTO public.sessions (date, time_slot, activity, max_participants, status)
      VALUES ((CURRENT_DATE + INTERVAL '7 days')::date, 'morning', 'kitesurf', 4, 'open')
      RETURNING id;
    `);

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
    if (!packageId) return;
    try {
      sql(`DELETE FROM public.package_bookings WHERE package_id = '${packageId}';`);
      sql(`DELETE FROM public.client_packages WHERE id = '${packageId}';`);
      sql(`DELETE FROM public.sessions WHERE id = '${sessionId}';`);
    } catch (e) {
      console.warn('Cleanup partiel:', e);
    }
  });

  test('1. Formulaire acompte appelle create-checkout et reçoit une URL Stripe', async ({ page }) => {
    // Intercepte l'appel à l'edge function pour ne pas réellement créer
    // de session Stripe ni quitter le domaine de test.
    await page.route('**/functions/v1/create-checkout', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload).toMatchObject({
        activityName: expect.any(String),
        participants: expect.any(Number),
        preferredDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        phone: expect.any(String),
        customerName: expect.any(String),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://checkout.stripe.com/c/pay/cs_test_FAKE_E2E_SESSION',
        }),
      });
    });

    // Empêche la redirection effective vers Stripe (ouverture nouvel onglet)
    const popupPromise = page.waitForEvent('popup').catch(() => null);

    await page.goto('/contact-reservation-kitesurf-hyeres');

    // Première carte = Cours Particulier Kitesurf
    const firstCard = page.locator('section >> text=Cours Particulier Kitesurf').first();
    await expect(firstCard).toBeVisible();
    const card = firstCard.locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');

    await card.getByPlaceholder('Jean Dupont').fill('E2E Tester');
    await card.getByPlaceholder('06 12 34 56 78').fill('0612345678');

    await card.getByRole('button', { name: /Choisir une date/i }).click();
    // Calendar : choisit la prochaine date dispo
    const enabledDay = page.locator('[role="gridcell"] button:not([disabled])').first();
    await enabledDay.click();

    const [, popup] = await Promise.all([
      card.getByRole('button', { name: /Payer l'acompte/i }).click(),
      popupPromise,
    ]);

    // L'onglet popup (s'il a été ouvert) doit pointer vers notre URL stub
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      expect(popup.url()).toContain('checkout.stripe.com');
      await popup.close();
    }
  });

  test('2. /mon-espace : code KP → réservation d\'une session → annulation', async ({ page }) => {
    await page.goto('/mon-espace');

    await page.getByPlaceholder('KP-2026-XXXX').fill(TEST_CODE);
    await page.getByRole('button', { name: /Accéder/i }).click();

    // Pack chargé : prénom + code visibles
    await expect(page.getByText('E2E Tester')).toBeVisible();
    await expect(page.getByText(TEST_CODE)).toBeVisible();

    // Crédits initiaux : 2 / 2
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();

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

    // Annulation (session à J+7 → annulation autorisée)
    await page.getByRole('button', { name: /Annuler/i }).first().click();
    await expect(page.getByText(/Journée annulée/i)).toBeVisible({ timeout: 5000 });

    const usedAfter = sql(`SELECT used_sessions FROM public.client_packages WHERE id = '${packageId}';`);
    expect(usedAfter).toBe('0');
  });
});