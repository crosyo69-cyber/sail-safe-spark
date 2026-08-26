import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { analyticsService } from "@/services/analytics.service";
import { settle } from "@/services/_shared/result";

/** Ligne renvoyée par la RPC `get_latest_auth_email_status` (inchangée). */
type AuthEmailStatusRow = {
  status: string;
  last_event_at: string;
  error_message: string | null;
};
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, MailCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const emailSchema = z.string().trim().email("Email invalide").max(255, "Email trop long");
const passwordSchema = z.string().min(6, "6 caractères minimum").max(128, "Mot de passe trop long");
const displayNameSchema = z.string().trim().min(2, "2 caractères minimum").max(50, "Nom trop long");

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupPendingEmail, setSignupPendingEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailStatus, setEmailStatus] = useState<{
    status: string;
    last_event_at: string;
    error_message: string | null;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Same-origin relative path only, to avoid open-redirect abuse.
  const rawNext = searchParams.get("next") ?? "";
  const nextTarget = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ne rediriger que sur une vraie connexion (évite la boucle au montage
      // avec INITIAL_SESSION / TOKEN_REFRESHED qui renvoyait immédiatement
      // l'utilisateur en arrière, faisant "repartir" le formulaire).
      if (event === "SIGNED_IN" && session?.user) {
        navigate(nextTarget, { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(nextTarget, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, nextTarget]);

  // Cooldown ticker (30s) pour éviter le spam Supabase rate-limit
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Récupère l'état du dernier email envoyé à cette adresse
  const fetchEmailStatus = async (targetEmail: string) => {
    setStatusLoading(true);
    const { data, error } = settle(
      await analyticsService.latestAuthEmailStatus<AuthEmailStatusRow[]>({
        p_email: targetEmail,
      }),
    );
    if (!error && data && data.length > 0) {
      setEmailStatus({
        status: data[0].status,
        last_event_at: data[0].last_event_at,
        error_message: data[0].error_message,
      });
    } else if (!error) {
      setEmailStatus(null);
    }
    setStatusLoading(false);
  };

  // Polling toutes les 5s tant que l'écran de confirmation est affiché
  useEffect(() => {
    if (!signupPendingEmail) {
      setEmailStatus(null);
      return;
    }
    fetchEmailStatus(signupPendingEmail);
    const id = setInterval(() => fetchEmailStatus(signupPendingEmail), 5000);
    return () => clearInterval(id);
  }, [signupPendingEmail]);

  // Tente un renvoi avec 1 retry auto en cas d'échec réseau / transitoire
  const resendConfirmation = async (targetEmail: string): Promise<void> => {
    setIsResending(true);
    const redirectUrl = `${window.location.origin}/`;

    const attempt = async () =>
      supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: { emailRedirectTo: redirectUrl },
      });

    let { error } = await attempt();

    if (error) {
      // 1 seul retry automatique après 1,5s
      await new Promise((r) => setTimeout(r, 1500));
      const retry = await attempt();
      error = retry.error;
      if (!error) {
        toast.success("E-mail renvoyé après une nouvelle tentative.");
      }
    } else {
      toast.success("E-mail de confirmation renvoyé. Vérifiez votre boîte.");
    }

    if (error) {
      toast.error(
        error.message?.includes("rate")
          ? "Trop de tentatives. Réessayez dans quelques instants."
          : `Échec de l'envoi : ${error.message}`,
      );
    } else {
      setResendCooldown(30);
    }

    setIsResending(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      displayNameSchema.parse(displayName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Compte créé avec succès !");
    // Affiche le panneau "vérifiez votre email" — si l'auto-confirm est
    // actif côté Supabase, onAuthStateChange déclenchera la redirection.
    setSignupPendingEmail(email.trim());
    setPassword("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Connexion réussie !");
  };

  return (
    <>
      <Helmet>
        <title>Connexion | Kitesurf Passion Hyères</title>
        <meta name="description" content="Connectez-vous pour commenter les articles du blog Kitesurf Passion Hyères." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Bienvenue</CardTitle>
              <CardDescription>
                Connectez-vous pour commenter les articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signupPendingEmail ? (
                <div className="space-y-5 py-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <MailCheck className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Vérifiez votre boîte mail</h2>
                    <p className="text-sm text-muted-foreground">
                      Nous avons envoyé un lien de confirmation à
                      <br />
                      <span className="font-medium text-foreground">{signupPendingEmail}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pensez à regarder dans vos courriers indésirables.
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="w-full min-h-[44px]"
                    onClick={() => resendConfirmation(signupPendingEmail)}
                    disabled={isResending || resendCooldown > 0}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renvoyer ({resendCooldown}s)
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renvoyer l'e-mail de confirmation
                      </>
                    )}
                  </Button>

                  {/* Indicateur d'état de l'e-mail */}
                  <div
                    className="rounded-md border bg-muted/40 p-3 text-left"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-2">
                      {!emailStatus ? (
                        <>
                          <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">
                            {statusLoading
                              ? "Vérification de l'envoi…"
                              : "En attente d'informations sur l'envoi…"}
                          </div>
                        </>
                      ) : emailStatus.status === "sent" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                          <div className="text-xs">
                            <div className="font-medium text-green-700">E-mail envoyé</div>
                            <div className="text-muted-foreground">
                              Dernier envoi&nbsp;:{" "}
                              {new Date(emailStatus.last_event_at).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </>
                      ) : emailStatus.status === "pending" ? (
                        <>
                          <Clock className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                          <div className="text-xs">
                            <div className="font-medium text-blue-600">En attente d'envoi</div>
                            <div className="text-muted-foreground">
                              En file depuis le{" "}
                              {new Date(emailStatus.last_event_at).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                          <div className="text-xs">
                            <div className="font-medium text-destructive">
                              Échec de l'envoi
                            </div>
                            <div className="text-muted-foreground">
                              Dernière tentative&nbsp;:{" "}
                              {new Date(emailStatus.last_event_at).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {emailStatus.error_message && (
                              <div className="text-destructive/80 mt-1 break-words">
                                {emailStatus.error_message}
                              </div>
                            )}
                            <div className="text-muted-foreground mt-1">
                              Utilisez le bouton « Renvoyer » ci-dessus.
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setSignupPendingEmail(null);
                      setResendCooldown(0);
                    }}
                  >
                    Utiliser une autre adresse
                  </Button>
                </div>
              ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nom d'affichage</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Votre pseudo"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="6 caractères minimum"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Inscription...
                        </>
                      ) : (
                        "Créer un compte"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Auth;
