import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Loader2 } from "lucide-react";

const ACTIVITIES = [
  { id: "kitesurf", label: "Kitesurf" },
  { id: "wingfoil", label: "Wingfoil" },
  { id: "kitefoil", label: "Kitefoil" },
];

export default function LastMinuteAlertForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [activities, setActivities] = useState<string[]>(["kitesurf", "wingfoil", "kitefoil"]);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(Date.now());

  const toggle = (id: string) =>
    setActivities((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (Date.now() - startedAt.current < 2500) {
      toast({ title: "Merci de patienter", description: "Vérification anti-spam.", variant: "destructive" });
      return;
    }
    if (!email.trim() || activities.length === 0) {
      toast({ title: "Champs requis", description: "Email et au moins une activité.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("last-minute-subscribe", {
      body: { email: email.trim().toLowerCase(), activities, honeypot, formTimestamp: startedAt.current },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erreur", description: (data as any)?.error || error?.message || "Réessayez.", variant: "destructive" });
      return;
    }
    toast({ title: "Email de confirmation envoyé", description: "Cliquez sur le lien dans l'email pour activer vos alertes." });
    setEmail("");
  };

  return (
    <Card className="p-6 bg-muted/30 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <BellRing className="w-5 h-5 text-primary" />
        <h3 className="font-display text-xl font-bold">Alertes Dernière Minute</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Soyez prévenu(e) dès qu'un créneau s'ouvre dans la fenêtre météo idéale.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          aria-hidden
        />
        <Input
          type="email"
          required
          placeholder="votre@email.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[44px]"
        />
        <div className="flex flex-wrap gap-4">
          {ACTIVITIES.map((a) => (
            <label key={a.id} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <Checkbox checked={activities.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={loading} className="w-full min-h-[44px]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "M'alerter"}
        </Button>
      </form>
    </Card>
  );
}