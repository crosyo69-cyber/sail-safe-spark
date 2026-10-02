import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Typed shim for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_uri?: string };
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

const authOAuth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorizationId)
      : await authOAuth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {error
              ? "Autorisation impossible"
              : details?.client?.name
                ? `Connecter ${details.client.name}`
                : "Autoriser cette application"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !details ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {details.client?.name ?? "Cette application"} demande l'accès à
                votre compte Kitesurf Passion pour agir en votre nom.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => decide(false)}
                >
                  Refuser
                </Button>
                <Button disabled={busy} onClick={() => decide(true)}>
                  Autoriser
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}