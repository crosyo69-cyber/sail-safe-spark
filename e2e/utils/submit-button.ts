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