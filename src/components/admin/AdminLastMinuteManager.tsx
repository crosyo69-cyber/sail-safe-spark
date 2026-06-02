import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Send, Flame, Wind } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLastMinuteSessions } from "@/hooks/useLastMinuteSessions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminLastMinuteManager() {
  const { toast } = useToast();
  const { sessions } = useLastMinuteSessions();
  const [creating, setCreating] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    time_slot: "morning" as "morning" | "early_afternoon" | "late_afternoon",
    activity: "kitesurf",
    max_participants: 4,
    last_minute_label: "fire" as "fire" | "wind",
    weather_note: "",
    notes: "",
  });

  const create = async () => {
    setCreating(true);
    const { error } = await supabase.from("sessions").insert({
      date: form.date,
      time_slot: form.time_slot as any,
      activity: form.activity as any,
      max_participants: form.max_participants,
      status: "open",
      notes: form.notes || null,
      weather_note: form.weather_note || null,
      last_minute_label: form.last_minute_label,
      is_last_minute: true,
      published_at: new Date().toISOString(),
    });
    setCreating(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Créneau ouvert", description: "Visible immédiatement sur la page Dernière Minute." });
  };

  const notify = async (sessionId: string) => {
    setNotifyingId(sessionId);
    const { data, error } = await supabase.functions.invoke("last-minute-notify", { body: { sessionId } });
    setNotifyingId(null);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Notifications envoyées", description: `${(data as any)?.sent ?? 0} abonné(s) prévenu(s).` });
  };

  const closeSession = async (id: string) => {
    const { error } = await supabase.from("sessions").update({ status: "closed" }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else toast({ title: "Créneau fermé" });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold mb-4">Ouvrir un créneau Dernière Minute</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} min={today} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Créneau</Label>
            <Select value={form.time_slot} onValueChange={(v: any) => setForm({ ...form, time_slot: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Matin</SelectItem>
                <SelectItem value="early_afternoon">Début d'après-midi</SelectItem>
                <SelectItem value="late_afternoon">Fin d'après-midi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activité</Label>
            <Select value={form.activity} onValueChange={(v) => setForm({ ...form, activity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kitesurf">Kitesurf</SelectItem>
                <SelectItem value="wingfoil">Wingfoil</SelectItem>
                <SelectItem value="pumpfoil">Pumpfoil / Kitefoil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Places disponibles</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
          <div>
            <Label>Badge</Label>
            <Select value={form.last_minute_label} onValueChange={(v: any) => setForm({ ...form, last_minute_label: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fire">🔥 Session Dernière Minute</SelectItem>
                <SelectItem value="wind">🌬️ Conditions exceptionnelles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note météo</Label>
            <Input
              placeholder="ex : 18-22 nœuds Est"
              value={form.weather_note}
              onChange={(e) => setForm({ ...form, weather_note: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={create} disabled={creating} className="mt-4 gap-2">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Ouvrir le créneau
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg font-bold mb-4">Créneaux Dernière Minute actifs</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun créneau actif.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md border">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={s.last_minute_label === "wind" ? "default" : "secondary"} className="gap-1">
                    {s.last_minute_label === "wind" ? <Wind className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
                    {s.activity}
                  </Badge>
                  <span className="text-sm">
                    {format(new Date(s.date), "EEE d MMM", { locale: fr })} · {s.time_slot}
                  </span>
                  <Badge variant="outline">{s.remaining}/{s.max_participants} places</Badge>
                  {s.status !== "open" && <Badge variant="destructive">Complet</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => notify(s.id)} disabled={notifyingId === s.id}>
                    {notifyingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                    Notifier
                  </Button>
                  {s.status === "open" && (
                    <Button size="sm" variant="ghost" onClick={() => closeSession(s.id)}>
                      Fermer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}