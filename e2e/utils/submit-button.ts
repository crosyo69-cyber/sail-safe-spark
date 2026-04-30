/**
 * Single source of truth for the CTA / contact form submit-button labels in
 * E2E tests. Any spec that asserts the loading state of the submit button
 * MUST import these constants — never hard-code "Envoi en cours..." or
 * "Envoyer ma demande" in a spec file.
 *
 * Both labels can be overridden at run time via env vars so a future copy
 * change only requires updating this file and (optionally) the env defaults
 * in CI — the specs themselves stay untouched.
 *
 *   E2E_SUBMIT_LOADING_LABEL → text shown while the form is submitting
 *   E2E_SUBMIT_IDLE_LABEL    → text shown when the form is idle / ready
 */

/** Default copy — must match `src/components/sections/CTASection.tsx`. */
export const DEFAULT_SUBMIT_LOADING_LABEL = 'Envoi en cours...';
export const DEFAULT_SUBMIT_IDLE_LABEL = 'Envoyer ma demande';

/** Env-overridable, trimmed runtime values used by every spec. */
export const SUBMIT_LOADING_LABEL: string = (
  process.env.E2E_SUBMIT_LOADING_LABEL ?? DEFAULT_SUBMIT_LOADING_LABEL
).trim();

export const SUBMIT_IDLE_LABEL: string = (
  process.env.E2E_SUBMIT_IDLE_LABEL ?? DEFAULT_SUBMIT_IDLE_LABEL
).trim();

/**
 * Escape a string for safe use inside a RegExp literal.
 * Mirrors the MDN-recommended implementation; kept local to avoid pulling
 * in a dependency for one-line helpers.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive RegExp matching the loading label exactly. */
export const SUBMIT_LOADING_LABEL_RE: RegExp = new RegExp(
  `^${escapeRegExp(SUBMIT_LOADING_LABEL)}$`,
  'i'
);

/** Case-insensitive RegExp matching the idle label exactly. */
export const SUBMIT_IDLE_LABEL_RE: RegExp = new RegExp(
  `^${escapeRegExp(SUBMIT_IDLE_LABEL)}$`,
  'i'
);

/* ------------------------------------------------------------------ */
/* Selector constants & helpers                                       */
/* ------------------------------------------------------------------ */

/**
 * Single source of truth for the submit button's `data-testid`.
 * Must match `data-testid="lead-submit"` in
 * `src/components/sections/CTASection.tsx`.
 */
export const SUBMIT_BUTTON_TESTID = 'lead-submit' as const;

/**
 * ARIA role used to locate the submit button by accessible name.
 * All native <button> elements implicitly have role="button" — this is
 * exposed as a constant so any future role change (e.g. switch to
 * <input type="submit">) only requires editing this file.
 */
export const SUBMIT_BUTTON_ROLE = 'button' as const;

/**
 * Locate the submit button using the canonical `data-testid` selector.
 * This is the PREFERRED way for every spec to grab the submit button —
 * it is decoupled from the visible label (idle vs loading) and from any
 * accessible-name change.
 *
 * Usage:
 *   import { getSubmitButton } from './utils/submit-button';
 *   const submitButton = getSubmitButton(page);
 */
export function getSubmitButton(page: import('@playwright/test').Page) {
  return page.getByTestId(SUBMIT_BUTTON_TESTID);
}

/**
 * Locate the submit button by role + idle accessible name.
 * Useful for assertions that specifically require the button to be in
 * its idle state (e.g. "no loading label visible").
 */
export function getSubmitButtonByIdleRole(
  page: import('@playwright/test').Page
) {
  return page.getByRole(SUBMIT_BUTTON_ROLE, { name: SUBMIT_IDLE_LABEL_RE });
}

/**
 * Locate the submit button by role + loading accessible name.
 * Useful when an assertion needs the button mid-submission.
 */
export function getSubmitButtonByLoadingRole(
  page: import('@playwright/test').Page
) {
  return page.getByRole(SUBMIT_BUTTON_ROLE, { name: SUBMIT_LOADING_LABEL_RE });
}