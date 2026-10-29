import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { trackPhoneClick } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Phone, Loader2, AlertTriangle } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { settle } from "@/services/_shared/result";

type BookingStatus = "loading" | "confirmed" | "pending" | "failed" | "unknown";

const ReservationConfirmee = () => {
  const [searchParams] = useSearchParams();
  const activity = searchParams.get("activity") || "votre activité";
  const isPack = searchParams.get("operation") === "pack_purchase";
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<BookingStatus>(sessionId ? "loading" : "pending");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    setStatus(sessionId ? "loading" : "pending");
    if (!sessionId) return;
    const checkStatus = async () => {
      try {
        let { data, error } = settle(await (isPack ? paymentService.getPackStatus(sessionId) : paymentService.getBookingStatus(sessionId)));
        if (isPack && error) {
          // Pack status RPC not activated yet: only a positive existing check may confirm.
          const fallback = settle(await paymentService.getBookingStatus(sessionId));
          ({ data, error } = fallback.data === "confirmed" ? fallback : { data: null, error });
        }
        if (cancelled) return;
        const nextStatus = !error && (data === "confirmed" || data === "failed") ? data : "pending";
        setStatus(nextStatus);
        attempts += 1;
        // Stripe may redirect before the webhook commits the booking.
        // Bounded retries keep slow bookings from remaining pending forever.
        if (nextStatus === "pending" && attempts < 15) {
          timer = setTimeout(checkStatus, 2000);
        }
      } catch {
        if (!cancelled) setStatus("pending");
      }
    };
    void checkStatus();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, isPack]);

  const phoneBlock = (
    <div className="border-t border-border pt-4 mt-4">
      <p className="text-foreground font-medium text-center">
        Contactez-nous la veille de votre venue pour confirmer votre créneau :
      </p>
      <a
        href="tel:0672716905"
        className="flex items-center justify-center gap-2 mt-3 text-primary font-bold text-xl hover:underline"
        onClick={() => trackPhoneClick("reservation_confirmee")}
      >
        <Phone className="w-5 h-5" />
        06 72 71 69 05
      </a>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Réservation Confirmée | KiteSurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen flex items-center justify-center py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            {status === "loading" && (
              <>
                <div className="w-20 h-20 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Vérification de votre réservation…
                </h1>
              </>
            )}

            {status === "confirmed" && (
              <>
                <div className="w-20 h-20 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  {isPack ? "Pack activé !" : "Réservation Confirmée !"}
                </h1>
                <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4 text-left">
                  <p className="text-foreground text-lg font-semibold text-center">
                    Votre acompte a bien été reçu !
                  </p>
                  <p className="text-muted-foreground text-center">
                    {isPack ? <>Votre pack pour <strong className="text-foreground">{activity}</strong> est activé. Aucune journée n’est réservée automatiquement ; utilisez le code reçu par e-mail.</> : <>Votre réservation pour <strong className="text-foreground">{activity}</strong> est confirmée.</>}
                  </p>
                  <p className="text-muted-foreground text-center">
                    Le solde sera à régler le jour de votre cours.
                  </p>
                  {!isPack && phoneBlock}
                </div>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="w-20 h-20 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  {isPack ? "Paiement reçu, activation du pack en cours de vérification" : "Paiement reçu, réservation en cours de vérification"}
                </h1>
                <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4 text-left">
                  <p className="text-muted-foreground text-center">
                    Votre paiement a bien été reçu. {isPack ? "L’activation de votre pack pour" : "La confirmation de votre réservation pour"}{" "}
                    <strong className="text-foreground">{activity}</strong> est en cours : vous recevrez
                    un e-mail de confirmation dans quelques instants.
                  </p>
                  {!isPack && phoneBlock}
                </div>
              </>
            )}

            {(status === "failed" || status === "unknown") && (
              <>
                <div className="w-20 h-20 mx-auto mb-8 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  {isPack ? "Paiement reçu, pack non activé" : "Paiement reçu, réservation non confirmée"}
                </h1>
                <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4 text-left">
                  <p className="text-muted-foreground text-center">
                    Votre paiement a bien été reçu, mais {isPack ? "votre pack n’a pas pu être activé" : "votre réservation n’a pas pu être confirmée"}
                    automatiquement. <strong className="text-foreground">Notre équipe doit régulariser
                    la situation</strong> et vous contactera dans les plus brefs délais.
                  </p>
                  {!isPack && phoneBlock}
                </div>
              </>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/">Retour à l'accueil</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Autre réservation</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ReservationConfirmee;
