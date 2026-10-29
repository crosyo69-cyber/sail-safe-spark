// Lot sécurité 1A — gabarit de l'e-mail « dernière minute ».
// La note admin est toujours rendue en texte inerte (jamais de HTML ni de lien).
import { cleanPlainText, escapeHtml, textToHtml } from "../_shared/html-escape.ts";

export const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Kitefoil / Pumpfoil",
};

export function buildHtml(opts: { activity: string; date: string; note: string | null; bookUrl: string; unsubscribeUrl: string }) {
  const noteHtml = textToHtml(opts.note);
  const badge = `<span style="background:#F97316;color:#fff;padding:6px 12px;border-radius:999px;font-size:13px;">🔥 Journée Dernière Minute</span>`;
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr><td style="background:#0F172A;color:#fff;padding:20px 24px;font-family:Montserrat,Arial,sans-serif;">
        <h1 style="margin:0;font-size:20px;">Nouvelle journée ouverte !</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#0F172A;">
        <p style="margin:0 0 12px;">${badge}</p>
        <h2 style="margin:8px 0;font-size:22px;">${escapeHtml(ACTIVITY_LABELS[opts.activity] || opts.activity)} — ${escapeHtml(opts.date)}</h2>
        ${noteHtml ? `<p style="margin:0 0 8px;"><strong>Météo :</strong> ${noteHtml}</p>` : ""}
        <p style="margin:0 0 8px;color:#64748B;font-size:13px;">Les horaires seront communiqués la veille par téléphone en fonction des conditions météorologiques.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${opts.bookUrl}" style="background:#F97316;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;">Je réserve ma place</a>
        </p>
        <p style="font-size:12px;color:#64748B;">Les places partent vite. <a href="${opts.unsubscribeUrl}" style="color:#0891B2;">Se désabonner</a></p>
      </td></tr>
    </table>
  </body></html>`;
}

export function buildText(opts: { activity: string; date: string; note: string | null; bookUrl: string }) {
  const label = ACTIVITY_LABELS[opts.activity] || opts.activity;
  const note = cleanPlainText(opts.note);
  return `Nouvelle journée ${label} le ${opts.date}${note ? `\nMétéo : ${note}` : ""}\nHoraires communiqués la veille selon la météo.\nRéserver : ${opts.bookUrl}`;
}
