import type { Page, Locator } from '@playwright/test';

/**
 * Helpers de sélection scopés au formulaire CTA principal (homepage #contact).
 *
 * Pourquoi : plusieurs formulaires de la home contiennent un champ email
 * (CTA principal + newsletter footer + variantes). Sélectionner par
 * placeholder global déclenche un strict-mode violation Playwright.
 * On scope donc explicitement via data-testid="lead-form".
 */
export function leadForm(page: Page): Locator {
  return page.getByTestId('lead-form');
}

export function leadEmail(page: Page): Locator {
  return page.getByTestId('lead-email');
}

export function leadFirstName(page: Page): Locator {
  return page.getByTestId('lead-firstname');
}

export function leadPhone(page: Page): Locator {
  return page.getByTestId('lead-phone');
}

export function leadSubmit(page: Page): Locator {
  return page.getByTestId('lead-submit');
}

/** Remplit les champs minimums requis pour soumettre le CTA principal. */
export async function fillLeadForm(
  page: Page,
  data: { firstName?: string; email: string; phone?: string },
) {
  await leadFirstName(page).fill(data.firstName ?? 'TestUser');
  await leadEmail(page).fill(data.email);
  await leadPhone(page).fill(data.phone ?? '0612345678');
}