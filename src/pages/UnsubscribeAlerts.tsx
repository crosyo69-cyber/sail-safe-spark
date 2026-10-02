import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { weatherService } from "@/services/weather.service";
import { settle } from "@/services/_shared/result";
import { CheckCircle, XCircle, Loader2, Mail, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type UnsubscribeStatus =
  | "loading"
  | "confirming"
  | "success"
  | "deleted"
  | "error"
  | "already_unsubscribed"
  | "optin_success"
  | "optin_error";

const UnsubscribeAlerts = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const confirmToken = searchParams.get("confirm");
  const [status, setStatus] = useState<UnsubscribeStatus>(searchParams.get("confirm") ? "loading" : "confirming");
  const [email, setEmail] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // F-22-01 : validation du double opt-in météo (?confirm=<token>)
  useEffect(() => {
    if (!confirmToken) return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      const { data: raw, error } = settle(await weatherService.confirm(confirmToken));
      if (cancelled) return;
      const data = (raw ?? {}) as { confirmed?: boolean };
      setStatus(!error && data.confirmed ? "optin_success" : "optin_error");
    })();
    return () => {
      cancelled = true;
    };
  }, [confirmToken]);

  const handleUnsubscribe = async (action: "pause" | "delete") => {
    if (!token && !confirmToken) {
      setStatus("error");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: raw, error } = settle(
        await weatherService.unsubscribe({ token, action: action === "delete" ? "delete" : "pause" }),
      );

      if (error) throw error;
      const data = (raw ?? {}) as { error?: string; email?: string; alreadyUnsubscribed?: boolean };

      if (data.error) {
        toast.error(data.error);
        setStatus("error");
        return;
      }

      setEmail(data.email || "");
      if (data.alreadyUnsubscribed) {
        setStatus("already_unsubscribed");
      } else if (action === "delete") {
        setStatus("deleted");
        toast.success("Abonnement supprimé définitivement");
      } else {
        setStatus("success");
        toast.success("Désabonnement effectué");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      toast.error("Une erreur est survenue");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Lien invalide | Kitesurf Passion</title>
        </Helmet>
        <Header />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <CardTitle>Lien invalide</CardTitle>
              <CardDescription>
                Ce lien de désabonnement n'est pas valide ou a expiré.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Désabonnement alertes météo | Kitesurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <Card className="max-w-lg mx-auto">
          {status === "confirming" && (
            <>
              <CardHeader className="text-center">
                <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
                <CardTitle>Gérer votre abonnement</CardTitle>
                <CardDescription>
                  Vous pouvez mettre en pause ou supprimer définitivement votre abonnement aux alertes météo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleUnsubscribe("pause")}
                  disabled={isProcessing}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Mettre en pause les alertes
                </Button>
                
                <Button 
                  onClick={() => handleUnsubscribe("delete")}
                  disabled={isProcessing}
                  className="w-full"
                  variant="destructive"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Supprimer définitivement
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  La mise en pause conserve vos préférences pour une réactivation ultérieure.
                  La suppression efface toutes vos données.
                </p>
              </CardContent>
            </>
          )}

          {status === "loading" && (
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Traitement en cours...</p>
            </CardContent>
          )}

          {status === "success" && (
            <>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Alertes désactivées</CardTitle>
                <CardDescription>
                  Vous ne recevrez plus d'alertes météo.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vos préférences ont été conservées. Vous pourrez vous réabonner à tout moment.
                </p>
                <Link to="/spot-kitesurf-almanarre-hyeres-var">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au spot
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === "deleted" && (
            <>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Abonnement supprimé</CardTitle>
                <CardDescription>
                  Votre abonnement a été définitivement supprimé.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Toutes vos données ont été effacées de notre base.
                </p>
                <Link to="/spot-kitesurf-almanarre-hyeres-var">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au spot
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === "already_unsubscribed" && (
            <>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <CardTitle>Déjà désabonné</CardTitle>
                <CardDescription>
                  Vous êtes déjà désabonné des alertes météo.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/spot-kitesurf-almanarre-hyeres-var">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au spot
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === "optin_success" && (
            <>
              <CardHeader className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Alertes météo activées</CardTitle>
                <CardDescription>
                  Votre abonnement est confirmé. Vous recevrez un e-mail lorsque les conditions correspondront à vos critères.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/spot-kitesurf-almanarre-hyeres-var">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au spot
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === "optin_error" && (
            <>
              <CardHeader className="text-center">
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <CardTitle>Lien de confirmation invalide</CardTitle>
                <CardDescription>
                  Ce lien a expiré ou a déjà été utilisé. Vous pouvez relancer une inscription depuis la page du spot.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/spot-kitesurf-almanarre-hyeres-var">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au spot
                  </Button>
                </Link>
              </CardContent>
            </>
          )}

          {status === "error" && (
            <>
              <CardHeader className="text-center">
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <CardTitle>Erreur</CardTitle>
                <CardDescription>
                  Une erreur est survenue lors du désabonnement. Le lien est peut-être expiré ou invalide.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Button variant="outline">
                    Contactez-nous
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default UnsubscribeAlerts;
