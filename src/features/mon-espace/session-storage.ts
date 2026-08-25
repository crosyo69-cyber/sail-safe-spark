/**
 * Stockage du jeton de session « Mon espace ».
 * sessionStorage uniquement (survit au refresh de l'onglet, jamais au navigateur).
 * Aucun package_code, aucun e-mail, aucun OTP n'est stocké ici.
 */

const TOKEN_KEY = "kp_espace_session";
/** Code saisi sur /reserver, transmis à /mon-espace sans passer par l'URL. */
const PENDING_CODE_KEY = "kp_espace_pending_code";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const readSessionToken = (): string =>
  safe(() => sessionStorage.getItem(TOKEN_KEY) || "", "");

export const writeSessionToken = (token: string): void => {
  safe(() => sessionStorage.setItem(TOKEN_KEY, token), undefined);
};

export const clearSessionToken = (): void => {
  safe(() => sessionStorage.removeItem(TOKEN_KEY), undefined);
};

export const takePendingCode = (): string =>
  safe(() => {
    const v = sessionStorage.getItem(PENDING_CODE_KEY) || "";
    sessionStorage.removeItem(PENDING_CODE_KEY);
    return v;
  }, "");

export const setPendingCode = (code: string): void => {
  safe(() => sessionStorage.setItem(PENDING_CODE_KEY, code.trim().toUpperCase()), undefined);
};
