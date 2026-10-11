/** Presentation only: never used to select groups or determine payment amounts. */
export function ffvlLicenceEmailNotice(activity: string): string {
  const name = activity.toLowerCase().trim();
  const concerned = ["kitesurf", "wingfoil", "wing foil", "cours particulier", "cours à la carte", "cours-carte", "stage-100-glisse", "stage_100_glisse", "100% glisse", "100 % glisse", "stage 100"].some((label) => name.includes(label));
  if (!concerned || /location|dépose|depose/.test(name)) return "";
  return `<tr><td style="padding:0 25px 24px;"><p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">La licence n'est pas incluse dans le tarif. Elle est à prendre en ligne sur <a href="https://ffvl.fr" target="_blank" rel="noopener noreferrer" style="color:#057F94;text-decoration:underline;">ffvl.fr</a> avant la session.</p></td></tr>`;
}