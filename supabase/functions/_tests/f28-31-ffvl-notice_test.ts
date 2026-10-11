import { ffvlLicenceEmailNotice } from "../_shared/ffvl-licence-notice.ts";
import { buildStageCustomerEmail } from "../stripe-webhook/stage.ts";
const assert = (value: boolean, message: string) => { if (!value) throw new Error(message); };
for (const activity of ["Cours Particulier Kitesurf", "Cours à la Carte", "Cours Wingfoil", "Stage 100% Glisse", "kitesurf", "wingfoil", "stage_100_glisse"]) {
  Deno.test(`FFVL: confirmation ${activity}`, () => {
    const html = ffvlLicenceEmailNotice(activity);
    assert(html.includes("La licence n'est pas incluse dans le tarif."), "Phrase exacte absente");
    assert(html.includes('href="https://ffvl.fr" target="_blank" rel="noopener noreferrer"'), "Lien sûr absent");
    assert(html.includes("avant la session."), "Échéance absente");
  });
}
for (const activity of ["Location Matériel", "Location Kitesurf", "Déposes en mer", "Foil Tracté", "Pumpfoil", "Wakeboard", "E-foil", ""]) {
  Deno.test(`FFVL: aucune mention hors périmètre ${activity}`, () => assert(ffvlLicenceEmailNotice(activity) === "", "Mention hors périmètre"));
}
Deno.test("FFVL: confirmation stage conserve prix, dates, codes", () => {
  const html = buildStageCustomerEmail("logo.png", {ok:true,participants:2,stripeAmountCents:50000,expectedAmountCents:50000,startDate:"2026-10-12",email:"test@example.invalid"}, ["KP-TEST-A", "KP-TEST-B"]);
  for (const text of ["500 €", "2026-10-12", "KP-TEST-A", "KP-TEST-B", "Vos 5 journées sont réservées.", "La licence n'est pas incluse dans le tarif."]) assert(html.includes(text), `Texte absent: ${text}`);
});
Deno.test("FFVL: SQL préparé conserve toute la fonction hors ajout de présentation", () => {
  const before = Deno.readTextFileSync("drizzle/migrations/0005_f28_13_last_minute_booking_emails.sql");
  const pending = Deno.readTextFileSync("docs/f28-31/booking-confirmation-template.pending.sql");
  const restored = pending.replace(/^--.*\n/gm, "").replace(/  v_text := v_text \|\| CASE[^\n]*\n\n/, "").replace(/    CASE WHEN v_pkg.activity::text IN[^\n]*\n/, "");
  assert(restored === before, "La fonction a changé hors présentation autorisée");
});
