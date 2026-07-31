import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Bot, Loader2, Send, ShieldCheck, Sparkles, Trash2, User } from "lucide-react";
import { AssistantBriefing } from "@/components/admin/AssistantBriefing";
import { AssistantFinances } from "@/components/admin/AssistantFinances";
import { AssistantActions, type AssistantActionsHandle } from "@/components/admin/AssistantActions";
import { opportunityAction } from "@/components/admin/action-types";
import type { BriefingOpportunity } from "@/components/admin/briefing-types";

type ChatMessage = { role: "user" | "assistant"; content: string };

const DEFAULT_SUGGESTIONS = [
  "Combien de réservations aujourd'hui ?",
  "Quel est le CA du mois ?",
  "Quels crédits expirent bientôt ?",
  "Quelles journées sont complètes ?",
  "Qui dois-je relancer ?",
  "Quelle activité fonctionne le mieux ?",
];

const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assistant`;

const renderMarkdown = (content: string) =>
  DOMPurify.sanitize(marked.parse(content, { async: false }) as string);

const AdminAssistant = () => {
  const { isAdmin, isLoading } = useAdmin();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const endRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<AssistantActionsHandle>(null);

  useEffect(() => {
    if (messages.length > 0 || busy) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const handleSuggestions = useCallback((questions: string[]) => {
    if (questions.length > 0) setSuggestions(questions.slice(0, 6));
  }, []);

  const handlePrepare = useCallback((o: BriefingOpportunity) => {
    const mapped = opportunityAction(o.type);
    void actionsRef.current?.prepare(
      mapped.type,
      {
        priority: mapped.priority,
        activity: o.action?.activity ?? null,
        date: o.action?.date ?? null,
        days: o.action?.days ?? null,
        title: o.titre,
        justification: o.pourquoi,
      },
      `${o.titre} — ${o.pourquoi}`,
    );
  }, []);

  const ask = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const next: ChatMessage[] = [...messages, { role: "user", content: question }];
      setMessages(next);
      setInput("");
      setBusy(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Session expirée, reconnectez-vous.");

        const resp = await fetch(ASSISTANT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: next }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data.error || "Erreur de l'assistant");

        setMessages((prev) => [...prev, { role: "assistant", content: data.answer as string }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        toast.error(msg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${msg}` },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [messages, busy],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Assistant du Directeur | Administration KiteSurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <main className="container mx-auto flex-1 px-4 py-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'administration
              </Link>
            </Button>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Bot className="h-7 w-7 text-primary" /> Cockpit IA du Directeur
            </h1>
            <p className="text-muted-foreground">
              Interrogez vos données en langage naturel : réservations, CRM, crédits, marketing, chiffre d'affaires.
            </p>
          </div>
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Lecture seule
          </Badge>
        </div>

        <div className="mb-6">
          <AssistantBriefing onAsk={(q) => void ask(q)} onSuggestions={handleSuggestions} onPrepare={handlePrepare} />
        </div>

        <div className="mb-6">
          <AssistantFinances onAsk={(q) => void ask(q)} />
        </div>

        <div className="mb-8">
          <AssistantActions ref={actionsRef} onAsk={(q) => void ask(q)} />
        </div>

        <Card className="flex h-[70vh] flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-3">
            <CardTitle className="text-base">Conversation</CardTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={busy}>
                <Trash2 className="mr-2 h-4 w-4" /> Effacer
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted p-4 text-sm">
                  <p className="mb-1 font-medium">Bonjour 👋</p>
                  <p className="text-muted-foreground">
                    Je lis vos données en temps réel et je réponds en Markdown avec des tableaux quand c'est utile.
                    Je ne peux exécuter aucune action (email, campagne, recrédit, modification) — uniquement les préparer.
                  </p>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" /> Questions suggérées
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        className="min-h-[44px] rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                {m.role === "user" ? (
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                    {m.content}
                  </div>
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-[85%] rounded-xl bg-muted px-4 py-3 text-sm prose-table:text-xs prose-th:text-left"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                  />
                )}
                {m.role === "user" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyse des données…
              </div>
            )}
            <div ref={endRef} />
          </CardContent>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question (ex : quel est le CA du mois ?)"
              disabled={busy}
              className="min-h-[44px]"
            />
            <Button type="submit" disabled={busy || !input.trim()} className="min-h-[44px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Card>

        <p className="mt-3 text-xs text-muted-foreground">
          Toutes les conversations sont journalisées. L'assistant accède aux données uniquement via la couche de lecture
          sécurisée <code>assistant_query</code> — aucune écriture n'est possible.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default AdminAssistant;
