import { test, expect } from '@playwright/test';

const sessionId = 'cs_test_QAReturnSession000000000000';
const returnPath = `/reservation-confirmee?activity=Kitesurf&session_id=${sessionId}`;

test('return checks the exact checkout reference and reaches confirmed after webhook delay', async ({ page }) => {
  let calls = 0;
  await page.route('**/rest/v1/rpc/get_payment_booking_status', async route => {
    expect(route.request().postDataJSON()).toEqual({ p_stripe_session_id: sessionId });
    calls += 1;
    await route.fulfill({ json: calls === 1 ? 'pending' : 'confirmed' });
  });
  await page.goto(returnPath);
  await expect(page.getByRole('heading', { name: 'Réservation Confirmée !', exact: true })).toBeVisible();
  expect(calls).toBe(2);
  await page.waitForTimeout(2500);
  expect(calls).toBe(2);
});

test('refused bookings never become confirmed and stop polling', async ({ page }) => {
  let calls = 0;
  await page.route('**/rest/v1/rpc/get_payment_booking_status', async route => {
    calls += 1;
    await route.fulfill({ json: 'failed' });
  });
  await page.goto(returnPath);
  await expect(page.getByRole('heading', { name: 'Paiement reçu, réservation non confirmée', exact: true })).toBeVisible();
  await page.waitForTimeout(2500);
  expect(calls).toBe(1);
});

test('return without session never invents confirmation', async ({ page }) => {
  let calls = 0;
  await page.route('**/rest/v1/rpc/get_payment_booking_status', async route => {
    calls += 1;
    await route.fulfill({ json: 'confirmed' });
  });
  await page.goto('/reservation-confirmee?activity=Kitesurf');
  await expect(page.getByRole('heading', { name: 'Paiement reçu, réservation en cours de vérification', exact: true })).toBeVisible();
  expect(calls).toBe(0);
});