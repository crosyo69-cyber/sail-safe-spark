import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AlerteDerniereMinute() {
  const [params] = useSearchParams();
  const confirmToken = params.get("confirm");
  const unsubscribeToken = params.get("unsubscribe");
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      if (confirmToken) {
        const { data, error } = await supabase.rpc("confirm_last_minute_subscription", { p_token: confirmToken });
        if (error || !data) {
          setState("err");
          setMessage("Lien invalide ou déjà utilisé.");
        } else {
          setState("ok");
          setMessage("Vos alertes sont activées. À très vite sur l'eau !");
        }
      } else if (unsubscribeToken) {
        const { data, error } = await supabase.rpc("unsubscribe_last_minute", { p_token: unsubscribeToken });
        if (error || !data) {
          setState("err");
          setMessage("Lien invalide ou déjà utilisé.");
        } else {
          setState("ok");
          setMessage("Vous êtes désabonné(e) des alertes Dernière Minute.");
        }
      } else {
        setState("err");
        setMessage("Lien invalide.");
      }
    };
    run();
  }, [confirmToken, unsubscribeToken]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-md mx-auto p-8 text-center">
          {state === "loading" && <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />}
          {state === "ok" && <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-3" />}
          {state === "err" && <XCircle className="w-12 h-12 mx-auto text-destructive mb-3" />}
          <p className="mt-3 text-foreground">{message}</p>
          <Button asChild className="mt-6">
            <Link to="/dernieres-minutes">Voir les sessions</Link>
          </Button>
        </Card>
      </main>
      <Footer />
    </div>
  );
}