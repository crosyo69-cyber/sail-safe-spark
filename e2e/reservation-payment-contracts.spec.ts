import { test, expect, type Page, type Route } from './fixtures';

/**
 * FILET DE NON-RÉGRESSION — parcours réservation / paiement.
 *
 * Principe : AUCUNE dépendance système (pas de `psql`, pas de vraie
 * transaction Stripe, pas d'écriture en base). Tous les appels backend sont
 * interceptés par Playwright et vérifiés au niveau du CONTRAT :
 *   - URL du RPC / edge function appelée
 *   - paramètres exacts envoyés
 *   - comportement de l'UI selon la réponse
 *
 * Ces tests ne peuvent donc pas être "verts par absence de dépendance" :
 * ils échouent si le contrat change.
 */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
};

async function jsonRoute(route: Route, body: unknown) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(body),
  });
}

/** Date déterministe : J+30, format YYYY-MM-DD. */
function testDate(): { iso: string; day: number } {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { iso, day: d.getDate() };
}

/** Ouvre /reserver et sélectionne la date J+30 dans le calendrier. */
async function selectTestDate(page: Page, day: number) {
  await page.getByRole('button', { name: /Sélectionner une date/i }).click();
  // Le calendrier s'ouvre sur le mois courant : on avance si le jour cible
  // appartient au mois suivant.
  const target = page.locator(`button[name="day"]:not([disabled])`, { hasText: new RegExp(`^${day}$`) });
  if ((await target.count()) === 0) {
    await page.getByRole('button', { name: /next|suivant/i }).first().click();
  }
  await target.first().click();
}

test.describe('Contrats réservation / paiement', () => {
  // ───────────────────────────── TEST 1 — create-checkout
  test('1. create-checkout reçoit le payload attendu, une Idempotency-Key valide et renvoie une URL Stripe', async ({ page, context }) => {
    const calls: { payload: Record<string, unknown>; key?: string }[] = [];

    await page.route('**/functions/v1/create-checkout', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      calls.push({
        payload: route.request().postDataJSON(),
        key: route.request().headers()['idempotency-key'],
      });
      await jsonRoute(route, { url: 'https://checkout.stripe.com/c/pay/cs_test_E2E_FAKE' });
    });
    // Empêche toute navigation réelle vers Stripe (le composant ouvre un onglet).
    await context.route('https://checkout.stripe.com/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: 'stripe-stub' }),
    );

    await page.goto('/contact-reservation-kitesurf-hyeres');

    const card = page
      .locator('section >> text=Cours Particulier Kitesurf')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    await expect(card).toBeVisible();

    const nameInput = card.getByPlaceholder('Jean Dupont');
    await nameInput.fill('E2E Tester');
    await card.getByPlaceholder('06 12 34 56 78').fill('0612345678');
    await card.getByRole('button', { name: /Choisir une date/i }).click();
    await page.locator('button[name="day"]:not([disabled])').first().click();
    await page.keyboard.press('Escape').catch(() => {});

    const payBtn = card.getByRole('button', { name: /Payer l'acompte/i });
    await payBtn.scrollIntoViewIfNeeded();
    await payBtn.click({ force: true });

    await expect.poll(() => calls.length, { timeout: 15_000 }).toBe(1);
    expect(calls[0].payload).toMatchObject({
      activityName: expect.stringContaining('Cours Particulier'),
      participants: expect.any(Number),
      preferredDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      phone: '0612345678',
      customerName: 'E2E Tester',
      totalSessions: expect.any(Number),
    });

    // Contrat A4 (post P0-1) : la clé d'idempotence est OBLIGATOIRE et doit
    // respecter le regex serveur de create-checkout.
    expect(calls[0].key).toBeDefined();
    expect(calls[0].key!).toMatch(/^[A-Za-z0-9._:-]{16,255}$/);

    // 2e clic, panier INCHANGÉ → même intention → MÊME clé.
    await payBtn.click({ force: true });
    await expect.poll(() => calls.length, { timeout: 15_000 }).toBe(2);
    expect(calls[1].key).toBe(calls[0].key);
    expect(calls[1].payload).toEqual(calls[0].payload);

    // Panier MODIFIÉ (nom client) → nouvelle intention → clé DIFFÉRENTE.
    await nameInput.fill('E2E Tester Bis');
    await payBtn.click({ force: true });
    await expect.poll(() => calls.length, { timeout: 15_000 }).toBe(3);
    expect(calls[2].key).toMatch(/^[A-Za-z0-9._:-]{16,255}$/);
    expect(calls[2].key).not.toBe(calls[0].key);
    expect(calls[2].payload).toMatchObject({ customerName: 'E2E Tester Bis' });

    // La réponse permet bien la redirection Stripe (nouvel onglet ouvert).
    await expect
      .poll(() => context.pages().some((p) => p.url().includes('checkout.stripe.com')), {
        timeout: 10_000,
      })
      .toBe(true);
  });


  // ───────────────────────────── TEST 3 — disponibilité (préalable aux autres)
  test('3. get_daily_availability est appelée avec p_date et alimente le calendrier', async ({ page }) => {
    const { iso, day } = testDate();
    const calls: Record<string, unknown>[] = [];

    await page.route('**/rest/v1/rpc/get_daily_availability', async (route) => {
      if (route.request().method() !== 'OPTIONS') calls.push(route.request().postDataJSON());
      await jsonRoute(route, {
        kitesurf: { places_restantes: 2, groupes: 1, capacite_potentielle: 4 },
        wingfoil: { places_restantes: 3, groupes: 0, capacite_potentielle: 3 },
      });
    });

    await page.goto('/reserver');
    await selectTestDate(page, day);

    await expect.poll(() => calls.length, { timeout: 15_000 }).toBeGreaterThan(0);
    expect(Object.keys(calls[0])).toEqual(['p_date']);
    expect(calls[0]).toEqual({ p_date: iso });

    // Contrat d'affichage : places restantes + groupes déjà formés.
    await expect(page.getByText('2 places restantes')).toBeVisible();
    await expect(page.getByText(/1 groupe déjà formé/)).toBeVisible();
  });

  // ───────────────────────────── TEST 2 — réservation journalière
  test('2. book_daily_with_code(p_code, p_date) — succès puis erreur métier', async ({ page }) => {
    const { iso, day } = testDate();
    let bookArgs: Record<string, unknown> | null = null;
    let bookResponse: unknown = { ok: true };

    await page.route('**/rest/v1/rpc/get_daily_availability', (route) =>
      jsonRoute(route, {
        kitesurf: { places_restantes: 3, groupes: 0, capacite_potentielle: 4 },
        wingfoil: { places_restantes: 3, groupes: 0, capacite_potentielle: 3 },
      }),
    );
    await page.route('**/rest/v1/rpc/book_daily_with_code', async (route) => {
      if (route.request().method() !== 'OPTIONS') bookArgs = route.request().postDataJSON();
      await jsonRoute(route, bookResponse);
    });

    // — Chemin erreur métier : message utilisateur contractuel
    bookResponse = { ok: false, error: 'no_credits_left' };
    await page.goto('/reserver');
    await page.getByPlaceholder('KP-2026-XXXX').fill('kp-test-1234');
    await selectTestDate(page, day);
    await page.getByRole('button', { name: /Réserver cette journée avec mon code/i }).click();

    await expect.poll(() => bookArgs, { timeout: 15_000 }).toBeTruthy();
    // Paramètres exacts + normalisation majuscules du code.
    expect(bookArgs).toEqual({ p_code: 'KP-TEST-1234', p_date: iso });
    await expect(page.getByText('Plus de crédits disponibles sur ce pack')).toBeVisible();

    // — Chemin nominal : succès + redirection /mon-espace/{code}
    bookArgs = null;
    bookResponse = { ok: true };
    await page.getByRole('button', { name: /Réserver cette journée avec mon code/i }).click();
    await expect.poll(() => bookArgs, { timeout: 15_000 }).toBeTruthy();
    await expect(page).toHaveURL(/\/mon-espace\/KP-TEST-1234$/, { timeout: 15_000 });
  });

  // ───────────────────────────── TEST 4 — waitlist
  test('4. join_waitlist reçoit les paramètres exacts (chemin nominal)', async ({ page }) => {
    const { iso, day } = testDate();
    let wlArgs: Record<string, unknown> | null = null;

    await page.route('**/rest/v1/rpc/get_daily_availability', (route) =>
      jsonRoute(route, {
        kitesurf: { places_restantes: 0, groupes: 1, capacite_potentielle: 4 },
        wingfoil: { places_restantes: 3, groupes: 0, capacite_potentielle: 3 },
      }),
    );
    await page.route('**/rest/v1/rpc/join_waitlist', async (route) => {
      if (route.request().method() !== 'OPTIONS') wlArgs = route.request().postDataJSON();
      await jsonRoute(route, { ok: true, already: false });
    });

    await page.goto('/reserver');
    await selectTestDate(page, day);

    await expect(page.getByText('Complet')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Rejoindre la liste d'attente/i }).click();

    const dialog = page.getByRole('dialog', { name: /liste d'attente/i });
    await expect(dialog).toBeVisible();
    await dialog.locator('#wl-first').fill('Jean');
    await dialog.locator('#wl-last').fill('Testeur');
    await dialog.locator('#wl-email').fill('E2E@Kitesurfpassion.TEST');
    await dialog.locator('#wl-phone').fill('0612345678');

    await dialog.getByRole('button', { name: /inscrire|Rejoindre|Confirmer|Valider/i }).last().click();

    await expect.poll(() => wlArgs, { timeout: 15_000 }).toBeTruthy();
    expect(wlArgs).toEqual({
      p_date: iso,
      p_activity: 'kitesurf',
      p_first_name: 'Jean',
      p_last_name: 'Testeur',
      p_email: 'e2e@kitesurfpassion.test',
      p_phone: '0612345678',
      p_participants: 1,
    });
    await expect(page.getByText(/liste d'attente/i).first()).toBeVisible();
  });
});
