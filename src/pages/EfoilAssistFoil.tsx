import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Battery, Wind, Check, Phone, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackPhoneClick } from "@/lib/analytics";
import { OptimizedImage } from "@/components/ui/optimized-image";
import efoilRider from "@/assets/efoil-rider-hyeres.jpg.asset.json";
import efoilRemote from "@/assets/efoil-telecommande-hyeres.jpg.asset.json";
import efoilBoard from "@/assets/efoil-board-foil-hyeres.jpg.asset.json";
import efoilActionDuotone from "@/assets/efoil-action-duotone-hyeres.jpg.asset.json";

const breadcrumbItems = [
  { label: "Location", href: "/location-materiel-kitesurf-hyeres" },
  { label: "E-Foil & Assist Foil" },
];

const formules = [
  { key: "initiation", label: "Initiation découverte (briefing + essai)", price: 49 },
  { key: "session-30", label: "Session 30 min", price: 69 },
  { key: "solo-1h", label: "Session solo 1h", price: 119 },
  { key: "duo-partage", label: "Duo partage 1 planche 1h total", price: 129 },
  { key: "duo-2", label: "Duo 2 planches 1h", price: 219 },
  { key: "sunset", label: "Session sunset premium 1h", price: 139 },
  { key: "pack-3", label: "Pack 3 séances (3×1h)", price: 330 },
  { key: "pack-5", label: "Pack 5 séances (5×1h)", price: 525 },
  { key: "pack-10", label: "Pack 10 séances (10×1h)", price: 990 },
];

const horaires = ["10h00", "11h00", "12h00", "13h00", "14h00", "15h00", "16h00", "17h00", "18h00", "19h00"];

const EfoilAssistFoil = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formTimestamp] = useState(Date.now());
  const [form, setForm] = useState({
    formule: "initiation",
    date: "",
    horaire: "10h00",
    participants: "1",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    videoOption: false,
    message: "",
    weatherAcknowledged: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const selectedFormule = formules.find((f) => f.key === form.formule)!;
  const totalPrice = selectedFormule.price + (form.videoOption ? 25 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (Date.now() - formTimestamp < 3000) {
      toast({ title: "Erreur", description: "Veuillez prendre le temps de remplir le formulaire.", variant: "destructive" });
      return;
    }
    if (!form.weatherAcknowledged) {
      toast({ title: "Confirmation requise", description: "Veuillez accepter la condition météo (vent < 10 nœuds).", variant: "destructive" });
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim() || !form.date) {
      toast({ title: "Champs manquants", description: "Merci de remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const detailedMessage = [
        `🛹 Formule : ${selectedFormule.label} — ${selectedFormule.price} €`,
        `📅 Date souhaitée : ${form.date}`,
        `⏰ Créneau : ${form.horaire}`,
        `👥 Participants : ${form.participants}`,
        `🎥 Option vidéo/drone : ${form.videoOption ? "Oui (+25 €)" : "Non"}`,
        `💶 Total estimé : ${totalPrice} €`,
        `✅ Condition météo (<10 nœuds) acceptée par le client.`,
        form.message ? `\n📝 Message : ${form.message}` : "",
      ].filter(Boolean).join("\n");

      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          activity: `E-Foil / Assist Foil — ${selectedFormule.label}`,
          startDate: form.date,
          participants: form.participants,
          message: detailedMessage,
          honeypot,
          formTimestamp,
        },
      });
      if (error || (data && (data as any).error)) {
        throw new Error(error?.message || (data as any).error);
      }
      toast({
        title: "Demande envoyée !",
        description: "Vous recevez un email de confirmation. Nous vous recontactons rapidement.",
      });
      setForm({
        formule: "initiation", date: "", horaire: "10h00", participants: "1",
        firstName: "", lastName: "", phone: "", email: "",
        videoOption: false, message: "", weatherAcknowledged: false,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Réessayez ou appelez-nous.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>E-Foil & Assist Foil Hyères | Kitesurf Passion</title>
        <meta name="description" content="Sessions E-Foil et Assist Foil à Hyères : surf électrique silencieux et foil à assistance. Initiation, packs progression, sunset. Réservation en ligne — Kitesurf Passion." />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/efoil-assist-foil-hyeres" />
        <meta property="og:title" content="E-Foil & Assist Foil Hyères | Kitesurf Passion" />
        <meta property="og:description" content="Volez sans vent : surf électrique à foil et foil à assistance électrique sur la baie d'Hyères." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/efoil-assist-foil-hyeres" />
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="pt-24">
        {/* Hero visuel */}
        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
          <OptimizedImage
            src={efoilRider.url}
            alt="Rider en e-foil Hyères glissant au-dessus de la Méditerranée — Kitesurf Passion Hyères"
            priority
            className="absolute inset-0 w-full h-full object-cover"
            wrapperClassName="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/20 to-background" />
          <div className="relative z-10 h-full flex flex-col items-center justify-end pb-12 text-center px-4 animate-fade-in">
            <span className="inline-block px-4 py-2 bg-background/90 backdrop-blur text-primary rounded-full text-sm font-medium mb-4">
              Nouveauté · Sans vent
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white drop-shadow-lg mb-3">
              E-Foil & Assist Foil <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-sunset">Hyères</span>
            </h1>
            <p className="text-white/90 max-w-2xl mx-auto text-lg drop-shadow">
              Volez au-dessus de l'eau, en silence, même sans vent — sur la baie d'Hyères.
            </p>
          </div>
        </section>

        {/* Section 1 — Présentation */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <Battery className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">E-Foil</h2>
                <p className="text-muted-foreground mb-4">
                  Planche de surf électrique équipée d'un foil hydrodynamique. Pas besoin de vent : un moteur électrique
                  silencieux propulse la planche et vous offre la sensation unique de voler au-dessus de l'eau.
                </p>
                <ul className="space-y-2">
                  {["Aucun vent requis", "Moteur électrique silencieux", "Accessible à tous niveaux", "Sensation de vol immédiate"].map((it) => (
                    <li key={it} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> {it}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="w-14 h-14 bg-sunset/10 rounded-xl flex items-center justify-center mb-5">
                  <Zap className="w-7 h-7 text-sunset" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Assist Foil</h2>
                <p className="text-muted-foreground mb-4">
                  Foil avec assistance électrique légère qui amplifie votre pompage. Idéal pour progresser plus vite
                  ou pour pratiquer les jours sans vent suffisant — tout en gardant le geste naturel du pumping.
                </p>
                <ul className="space-y-2">
                  {["Assistance au pompage", "Progression accélérée", "Parfait par vent faible", "Geste naturel conservé"].map((it) => (
                    <li key={it} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-sunset flex-shrink-0" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mosaïque immersive */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div className="md:col-span-2 md:row-span-2 group overflow-hidden rounded-2xl shadow-lg">
                <OptimizedImage
                  src={efoilRider.url}
                  alt="Initiation e-foil sur la baie d'Hyères, glisse silencieuse au-dessus de l'eau"
                  aspectRatio="4/3"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  wrapperClassName="w-full h-full"
                />
              </div>
              <div className="group overflow-hidden rounded-2xl shadow-lg">
                <OptimizedImage
                  src={efoilRemote.url}
                  alt="Télécommande e-foil et planche Duotone — cours e-foil Hyères"
                  aspectRatio="4/3"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  wrapperClassName="w-full h-full"
                />
              </div>
              <div className="group overflow-hidden rounded-2xl shadow-lg">
                <OptimizedImage
                  src={efoilBoard.url}
                  alt="Planche et foil électrique Méditerranée — matériel premium Kitesurf Passion Hyères"
                  aspectRatio="4/3"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  wrapperClassName="w-full h-full"
                />
              </div>
            </div>

            {/* Grande image action */}
            <div className="mt-8 overflow-hidden rounded-2xl shadow-xl group animate-fade-in">
              <OptimizedImage
                src={efoilActionDuotone.url}
                alt="Rider en action sur un e-foil Duotone au-dessus des vagues — sessions E-Foil et Assist Foil à Hyères"
                aspectRatio="21/9"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                wrapperClassName="w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* Section 2 — Tarifs */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-10">
              Grille tarifaire
            </h2>

            {[
              {
                title: "Formules principales",
                items: [
                  ["Initiation découverte (briefing + essai)", "49 €"],
                  ["Session 30 min", "69 €"],
                  ["Session solo 1h", "119 €"],
                  ["Duo partage 1 planche 1h total", "129 €"],
                  ["Duo 2 planches 1h", "219 €"],
                  ["Session sunset premium 1h", "139 €"],
                ],
              },
              {
                title: "Packs progression",
                items: [
                  ["Pack 3 séances (3×1h)", "330 €"],
                  ["Pack 5 séances (5×1h)", "525 €"],
                  ["Pack 10 séances (10×1h)", "990 €"],
                ],
              },
              {
                title: "Options et suppléments",
                items: [
                  ["Vidéo / drone souvenir", "25 €"],
                  ["Créneau coucher de soleil", "+20 €"],
                  ["eFoil supplémentaire groupe", "109 €"],
                  ["Privatisation / groupe / entreprise", "Sur devis"],
                  ["Bon cadeau", "Sans supplément"],
                ],
              },
            ].map((bloc) => (
              <div key={bloc.title} className="mb-8 bg-card rounded-2xl border border-border overflow-hidden">
                <div className="bg-primary/10 px-6 py-4 border-b border-border">
                  <h3 className="font-display text-xl font-bold text-primary">{bloc.title}</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {bloc.items.map(([name, price]) => (
                      <tr key={name} className="border-b border-border last:border-0">
                        <td className="px-6 py-3 text-foreground">{name}</td>
                        <td className="px-6 py-3 text-right font-bold text-sunset whitespace-nowrap">{price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Réservation */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-4">
              Demande de réservation
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Réservez votre créneau E-Foil ou Assist Foil — confirmation par email sous 24h.
            </p>

            {/* Avertissement vent */}
            <div className="bg-sunset/10 border-l-4 border-sunset rounded-lg p-4 mb-8 flex items-start gap-3">
              <Wind className="w-6 h-6 text-sunset flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Condition météo</p>
                <p className="text-sm text-muted-foreground">
                  Ces activités sont disponibles <strong>uniquement par vent inférieur à 10 nœuds</strong>.
                  En cas de dépassement le jour J, la session est annulée et un avoir ou remboursement vous est proposé.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 sm:p-8 rounded-2xl border border-border">
              {/* Honeypot */}
              <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ position: "absolute", left: "-9999px" }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

              <div>
                <Label htmlFor="formule">Formule choisie *</Label>
                <select id="formule" value={form.formule} onChange={(e) => set("formule", e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm">
                  {formules.map((f) => (
                    <option key={f.key} value={f.key}>{f.label} — {f.price} €</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date souhaitée *</Label>
                  <Input id="date" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="horaire">Créneau horaire *</Label>
                  <select id="horaire" value={form.horaire} onChange={(e) => set("horaire", e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm">
                    {horaires.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="participants">Nombre de participants *</Label>
                <Input id="participants" type="number" min={1} max={10} required value={form.participants} onChange={(e) => set("participants", e.target.value)} className="mt-1" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                <Checkbox id="video" checked={form.videoOption} onCheckedChange={(v) => set("videoOption", v === true)} className="mt-1" />
                <Label htmlFor="video" className="cursor-pointer">
                  Ajouter l'option <strong>vidéo / drone souvenir</strong> (+25 €)
                </Label>
              </div>

              <div>
                <Label htmlFor="message">Message libre (optionnel)</Label>
                <Textarea id="message" rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} className="mt-1" placeholder="Niveau, demandes particulières…" />
              </div>

              <div className="flex items-start gap-3 p-4 border-2 border-sunset/40 bg-sunset/5 rounded-lg">
                <Checkbox id="weather" checked={form.weatherAcknowledged} onCheckedChange={(v) => set("weatherAcknowledged", v === true)} className="mt-1" />
                <Label htmlFor="weather" className="cursor-pointer text-sm leading-relaxed">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-sunset" />
                  Je comprends que la session peut être annulée si le vent dépasse 10 nœuds le jour J — un avoir ou remboursement sera proposé. *
                </Label>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total estimé</p>
                  <p className="text-2xl font-bold text-primary">{totalPrice} €</p>
                </div>
                <Button type="submit" variant="sunset" size="lg" disabled={submitting}>
                  {submitting ? "Envoi…" : (<><Send className="w-4 h-4" /> Envoyer la demande</>)}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Ou appelez-nous directement :{" "}
                <a href="tel:0672716905" onClick={() => trackPhoneClick("efoil_form")} className="text-primary font-semibold inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" /> 06 72 71 69 05
                </a>
              </p>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Découvrez aussi le <Link to="/foil-tracte-hyeres" className="text-primary underline">foil tracté</Link> ou le{" "}
              <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary underline">wing foil</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default EfoilAssistFoil;