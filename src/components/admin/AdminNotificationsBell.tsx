import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Notif = {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type Props = {
  onOpenCenter?: () => void;
};

export default function AdminNotificationsBell({ onOpenCenter }: Props) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications" as any)
      .select("id, kind, severity, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    const rows = (data as unknown as Notif[]) || [];
    setNotifs(rows);
    setUnread(rows.filter((n) => !n.read_at).length);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin_notifications_bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_notifications" },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const markAllRead = async () => {
    const ids = notifs.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase
      .from("admin_notifications" as any)
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    void load();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 min-w-[44px] min-h-[44px]" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="font-semibold text-sm">Alertes ({unread} non lue{unread > 1 ? "s" : ""})</p>
          <Button size="sm" variant="ghost" onClick={markAllRead} disabled={unread === 0} className="h-7 text-xs">
            Tout lire
          </Button>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Aucune alerte récente</p>
          ) : (
            <ul>
              {notifs.map((n) => (
                <li
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 text-sm ${
                    n.read_at ? "" : "bg-muted/40"
                  } ${n.severity === "critical" ? "border-l-2 border-l-destructive" : n.severity === "warning" ? "border-l-2 border-l-orange-500" : ""}`}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                    il y a {formatDistanceToNow(new Date(n.created_at), { locale: fr })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        {onOpenCenter && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => { setOpen(false); onOpenCenter(); }}
            >
              Ouvrir le centre d'alertes
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}