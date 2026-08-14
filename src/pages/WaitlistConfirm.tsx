import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ACTIVITY_LABEL } from "@/features/reservation/constants";
import { useWaitlistOfferConfirmation } from "@/hooks/client/useWaitlist";

const WaitlistConfirm = () => {
  const { token } = useParams<{ token: string }>();
  const { offer, loading, busy, confirmed, handleConfirm } = useWaitlistOfferConfirmation(token);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Liste d'attente – Kitesurf Passion Hyères</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-xl">
        <h1 className="text-3xl font-display font-bold mb-6">Liste d'attente</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : !offer ? (
          <Card>
            <CardContent className="py-8 text-center space-y-3">
              <XCircle className="w-8 h-8 text-destructive mx-auto" />
              <p>Ce lien n'est plus valide.</p>
              <Button asChild><Link to="/reserver">Voir les disponibilités</Link></Button>
            </CardContent>
          </Card>
        ) : confirmed || offer.status === "converted" ? (
          <Card>
            <CardContent className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
              <p className="font-semibold">
                Votre place du {format(parseISO(offer.date), "EEEE d MMMM yyyy", { locale: fr })} est confirmée.
              </p>
              <p className="text-sm text-muted-foreground">
                Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 space-y-4">
              <p className="text-lg font-semibold">
                Une place s'est libérée en {ACTIVITY_LABEL[offer.activity] || offer.activity} le{" "}
                {format(parseISO(offer.date), "EEEE d MMMM yyyy", { locale: fr })}.
              </p>
              {offer.offer_expires_at && (
                <p className="text-sm text-muted-foreground">
                  À confirmer avant le{" "}
                  {format(parseISO(offer.offer_expires_at), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}.
                </p>
              )}
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Les horaires seront communiqués la veille par téléphone selon les conditions
                  météorologiques.
                </span>
              </div>
              <Button
                className="w-full min-h-[44px]"
                onClick={handleConfirm}
                disabled={busy || offer.status !== "offered"}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer ma place"}
              </Button>
              {offer.status !== "offered" && (
                <p className="text-xs text-destructive text-center">
                  Cette offre n'est plus active.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WaitlistConfirm;