import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildHtml, buildText } from "./template.ts";
import { textToHtml } from "../_shared/html-escape.ts";

const BOOK = "https://www.kitesurfpassion.fr/dernieres-minutes";
const UNSUB = "https://www.kitesurfpassion.fr/alerte-derniere-minute?unsubscribe=abc";
const html = (note: string | null) =>
  buildHtml({ activity: "kitesurf", date: "2026-11-02", note, bookUrl: BOOK, unsubscribeUrl: UNSUB });
const noteBlock = (h: string) => h.match(/<strong>Météo :<\/strong> ([\s\S]*?)<\/p>/)?.[1] ?? "";

Deno.test("texte ordinaire inchangé", () => {
  assertEquals(noteBlock(html("Vent 15 nœuds, mer calme")), "Vent 15 nœuds, mer calme");
});
Deno.test("retours à la ligne conservés", () => {
  assertEquals(noteBlock(html("Ligne 1\nLigne 2\r\nLigne 3")), "Ligne 1<br>Ligne 2<br>Ligne 3");
});
Deno.test("balises HTML neutralisées", () => {
  const b = noteBlock(html("<script>alert(1)</script><b>gras</b><iframe src=x>"));
  assert(!/[<>]/.test(b.replace(/<br>/g, "")));
  assert(b.includes("&lt;script&gt;"));
});
Deno.test("lien trompeur non actif", () => {
  const h = html('<a href="https://phishing.example/pay">Payer ici</a>');
  assertEquals((h.match(/<a /g) ?? []).length, 2); // seulement réservation + désabonnement
  assert(!h.includes('href="https://phishing'));
});
Deno.test("attributs et événements JavaScript neutralisés", () => {
  const b = noteBlock(html(`<img src=x onerror="alert('x')"> " onmouseover=alert(1) javascript:alert(1)`));
  assert(!b.includes("<img"));
  assert(!b.includes('"') && !b.includes("'"));
  assert(b.includes("&quot;") && b.includes("&#39;"));
});
Deno.test("accents et caractères spéciaux lisibles", () => {
  assertEquals(noteBlock(html("Été à Hyères & Giens ; « 20 % »")), "Été à Hyères &amp; Giens ; « 20 % »");
});
Deno.test("note vide ou absente : aucun bloc Météo", () => {
  for (const n of [null, "", "   \n "]) assert(!html(n).includes("Météo :"));
});
Deno.test("note très longue plafonnée à 500 caractères", () => {
  const out = textToHtml("a".repeat(5000));
  assertEquals(out.length, 501);
  assert(out.endsWith("…"));
});
Deno.test("caractères de contrôle retirés", () => {
  assertEquals(textToHtml("a\u0000b\u0007c"), "abc");
});
Deno.test("liens légitimes de l'e-mail intacts", () => {
  const h = html("<a href=evil>x</a>");
  assert(h.includes(`href="${BOOK}"`) && h.includes(`href="${UNSUB}"`));
  assert(h.includes("Kitesurf — 2026-11-02"));
});
Deno.test("version texte : note brute, sans HTML interprété", () => {
  const t = buildText({ activity: "kitesurf", date: "2026-11-02", note: "Vent fort\n<b>x</b>", bookUrl: BOOK });
  assert(t.includes("Météo : Vent fort\n<b>x</b>"));
  assert(t.includes(BOOK));
});
