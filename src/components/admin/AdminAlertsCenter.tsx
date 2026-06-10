import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Notif = {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
};

const SEVERITY_STYLES: Record<string, { badge: string; icon: typeof Info }> = {
  info: { badge: "bg-sky-100 text-sky-800 border-sky-200", icon: Info },
  warning: { badge: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
  critical: { badge: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
};

const KIND_LABELS: Record<string, string> = {
  booking_new: "Nouvelle réservation",
  session_full: "Session complète",
  last_minute_freed: "Place libérée",
  admin_credit: "Recrédit / débit",
  email_dlq: "Email en DLQ",
  stripe_webhook_error: "Erreur webhook Stripe",
  "404_spike": "Pic de 404",
  payment_failed: "Paiement échoué",
};

export default function AdminAlertsCenter() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("admin_notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter === "unread") q = q.is("read_at", null);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Erreur chargement alertes", description: error.message, variant: "destructive" });
    } else {
      setNotifs((data as unknown as Notif[]) || []);
    }
    setLoading(false);
  }, [filter, toast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin_notifications_center")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_notifications" },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications" as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else void load();
  };

  const markAllRead = async () => {
    const ids = notifs.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("admin_notifications" as any)
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${ids.length} alerte(s) marquée(s) comme lues` });
      void load();
    }
  };

  const removeOne = async (id: string) => {
    const { error } = await supabase.from("admin_notifications" as any).delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else void load();
  };

  const unreadCount = notifs.filter((n) => !n.read_at).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Centre d'alertes
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "unread" | "all")}>
            <TabsList>
              <TabsTrigger value="unread">Non lues</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0} className="gap-1">
            <CheckCheck className="w-4 h-4" /> Tout marquer lu
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : notifs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune alerte à afficher.</p>
        ) : (
          <ul className="space-y-2">
            {notifs.map((n) => {
              const sev = SEVERITY_STYLES[n.severity] || SEVERITY_STYLES.info;
              const Icon = sev.icon;
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${n.read_at ? "bg-background" : "bg-muted/30 border-primary/30"}`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${n.severity === "critical" ? "text-red-600" : n.severity === "warning" ? "text-orange-500" : "text-sky-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{n.title}</span>
                      <Badge variant="outline" className={sev.badge}>{n.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{KIND_LABELS[n.kind] || n.kind}</span>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      il y a {formatDistanceToNow(new Date(n.created_at), { locale: fr })}
                      {n.email_sent_at && <span className="ml-2">· email envoyé</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read_at && (
                      <Button size="icon" variant="ghost" onClick={() => markRead(n.id)} title="Marquer comme lue" className="h-8 w-8">
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => removeOne(n.id)} title="Supprimer" className="h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}