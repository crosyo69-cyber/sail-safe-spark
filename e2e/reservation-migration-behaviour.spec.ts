import { test, expect, type Route } from './fixtures';

/**
 * Compléments au filet contractuel — vérifient l'ISO-COMPORTEMENT après la
 * migration architecturale (Page → Hook métier → React Query → Service).
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

function testDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    day: d.getDate(),
  };
}

test.describe('Migration réservation — comportements', () => {
  test('code de pack vide : message de validation et AUCUN appel RPC', async ({ page }) => {
    const { day } = testDate();
    let bookCalls = 0;

    await page.route('**/rest/v1/rpc/get_daily_availability', (route) =>
      jsonRoute(route, {
        kitesurf: { places_restantes: 3, groupes: 0, capacite_potentielle: 4 },
        wingfoil: { places_restantes: 3, groupes: 0, capacite_potentielle: 3 },
      }),
    );
    await page.route('**/rest/v1/rpc/book_daily_with_code', async (route) => {
      if (route.request().method() !== 'OPTIONS') bookCalls += 1;
      await jsonRoute(route, { ok: true });
    });

    await page.goto('/reserver');
    await page.getByRole('button', { name: /Sélectionner une date/i }).click();
    const target = page.locator('button[name="day"]:not([disabled])', {
      hasText: new RegExp(`^${day}$`),
    });
    if ((await target.count()) === 0) {
      await page.getByRole('button', { name: /next|suivant/i }).first().click();
    }
    await target.first().click();

    await page.getByRole('button', { name: /Réserver cette journée avec mon code/i }).click();
    await expect(
      page.getByText('Saisissez votre code de pack ci-dessous, ou achetez un pack.'),
    ).toBeVisible();
    expect(bookCalls).toBe(0);
  });

  test('journée complète : bouton de réservation désactivé et liste d’attente proposée', async ({ page }) => {
    const { day } = testDate();
    await page.route('**/rest/v1/rpc/get_daily_availability', (route) =>
      jsonRoute(route, {
        kitesurf: { places_restantes: 0, groupes: 1, capacite_potentielle: 4 },
        wingfoil: { places_restantes: 3, groupes: 0, capacite_potentielle: 3 },
      }),
    );

    await page.goto('/reserver');
    await page.getByRole('button', { name: /Sélectionner une date/i }).click();
    const target = page.locator('button[name="day"]:not([disabled])', {
      hasText: new RegExp(`^${day}$`),
    });
    if ((await target.count()) === 0) {
      await page.getByRole('button', { name: /next|suivant/i }).first().click();
    }
    await target.first().click();

    await expect(page.getByText('Complet')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: /Réserver cette journée avec mon code/i }),
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: /Rejoindre la liste d'attente/i })).toBeVisible();
  });

  test('confirmation liste d’attente : get_waitlist_offer puis confirm_waitlist_offer(p_token)', async ({ page }) => {
    const { iso } = testDate();
    let offerArgs: Record<string, unknown> | null = null;
    let confirmArgs: Record<string, unknown> | null = null;
    let confirmResponse: unknown = { ok: false, error: 'offer_expired' };

    await page.route('**/rest/v1/rpc/get_waitlist_offer', async (route) => {
      if (route.request().method() !== 'OPTIONS') offerArgs = route.request().postDataJSON();
      await jsonRoute(route, {
        id: 'offer-1',
        date: iso,
        activity: 'kitesurf',
        status: 'offered',
        first_name: 'Jean',
        participants: 1,
        offer_expires_at: null,
      });
    });
    await page.route('**/rest/v1/rpc/confirm_waitlist_offer', async (route) => {
      if (route.request().method() !== 'OPTIONS') confirmArgs = route.request().postDataJSON();
      await jsonRoute(route, confirmResponse);
    });

    await page.goto('/liste-attente/tok-e2e-123');
    await expect.poll(() => offerArgs, { timeout: 15_000 }).toBeTruthy();
    expect(offerArgs).toEqual({ p_token: 'tok-e2e-123' });

    // Erreur métier : message contractuel inchangé.
    await page.getByRole('button', { name: /Confirmer ma place/i }).click();
    await expect.poll(() => confirmArgs, { timeout: 15_000 }).toBeTruthy();
    expect(confirmArgs).toEqual({ p_token: 'tok-e2e-123' });
    await expect(
      page.getByText('Le délai de 24 h est dépassé — la place a été proposée au suivant'),
    ).toBeVisible();

    // Chemin nominal : place confirmée.
    confirmResponse = { ok: true };
    await page.getByRole('button', { name: /Confirmer ma place/i }).click();
    await expect(page.getByText(/est confirmée/)).toBeVisible({ timeout: 15_000 });
  });
});
