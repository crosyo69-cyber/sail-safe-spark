import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Wind, Waves, Users, Trash2, ArrowRightLeft, Ban, Settings2, RefreshCw, CalendarIcon, RotateCcw } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RecreditDialog } from "@/components/admin/RecreditDialog";

type Member = {
  kind: "visitor" | "package";
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  participants: number;
  package_code?: string;
};

type DailyGroup = {
  id: string;
  activity: "kitesurf" | "wingfoil" | string;
  group_index: number;
  max_participants: number;
  status: "open" | "closed" | "cancelled" | string;
  notes: string | null;
  taken: number;
  members: Member[];
};

const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const ACTIVITY_ICON: Record<string, JSX.Element> = {
  kitesurf: <Wind className="w-4 h-4" />,
  wingfoil: <Waves className="w-4 h-4" />,
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  closed: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

const AdminJournees = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const [date, setDate] = useState<Date>(new Date());
  const [groups, setGroups] = useState<DailyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [editGroup, setEditGroup] = useState<DailyGroup | null>(null);
  const [moveMember, setMoveMember] = useState<{ member: Member; group: DailyGroup } | null>(null);
  const [moveDate, setMoveDate] = useState<Date | undefined>(undefined);
  const [recreditMember, setRecreditMember] = useState<Member | null>(null);
  const [recreditGroup, setRecreditGroup] = useState<DailyGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const iso = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase.rpc("admin_list_daily_groups", { p_date: iso });
    if (error) {
      toast.error("Erreur : " + error.message);
      setGroups([]);
    } else {
      setGroups((data as unknown as DailyGroup[]) || []);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleCancelGroup = async (g: DailyGroup) => {
    const reason = window.prompt(`Motif d'annulation du groupe ${ACTIVITY_LABEL[g.activity]} #${g.group_index} ?`);
    if (reason === null) return;
    const { error } = await supabase.rpc("admin_cancel_daily_group", { p_group_id: g.id, p_reason: reason || null });
    if (error) return toast.error(error.message);
    toast.success("Groupe annulé, crédits restitués");
    load();
  };

  const handleRemoveMember = async (m: Member) => {
    if (!confirm(`Retirer ${m.name} de ce groupe ?`)) return;
    const { error } = await supabase.rpc("admin_remove_group_member", { p_kind: m.kind, p_id: m.id });
    if (error) return toast.error(error.message);
    toast.success("Inscription retirée");
    load();
  };

  const handleCancelAndRecredit = async (reason: string) => {
    if (!recreditMember) return;
    const { error } = await supabase.rpc("admin_cancel_and_recredit", {
      p_kind: recreditMember.kind,
      p_id: recreditMember.id,
      p_reason: reason,
    });
    if (error) return toast.error(error.message);
    toast.success(
      recreditMember.kind === "package"
        ? "Inscription annulée et séance recréditée — email envoyé"
        : "Inscription visiteur annulée"
    );
    setRecreditMember(null);
    load();
  };

  const handleCancelGroupAndRecredit = async (reason: string) => {
    if (!recreditGroup) return;
    const { data, error } = await supabase.rpc("admin_cancel_group_and_recredit", {
      p_group_id: recreditGroup.id,
      p_reason: reason,
    });
    if (error) return toast.error(error.message);
    const n = (data as any)?.recredited ?? 0;
    toast.success(`Journée annulée — ${n} séance(s) recréditée(s), emails envoyés`);
    setRecreditGroup(null);
    load();
  };

  const handleMove = async () => {
    if (!moveMember || !moveDate) return;
    const { error } = await supabase.rpc("admin_move_group_member", {
      p_kind: moveMember.member.kind,
      p_id: moveMember.member.id,
      p_new_date: format(moveDate, "yyyy-MM-dd"),
    });
    if (error) return toast.error(error.message);
    toast.success("Membre déplacé");
    setMoveMember(null); setMoveDate(undefined);
    load();
  };

  const handleSaveEdit = async () => {
    if (!editGroup) return;
    const { error } = await supabase.rpc("admin_update_daily_group", {
      p_group_id: editGroup.id,
      p_max_participants: editGroup.max_participants,
      p_notes: editGroup.notes,
      p_status: editGroup.status,
    });
    if (error) return toast.error(error.message);
    toast.success("Groupe mis à jour");
    setEditGroup(null);
    load();
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const kiteGroups = groups.filter((g) => g.activity === "kitesurf");
  const wingGroups = groups.filter((g) => g.activity === "wingfoil");
  const otherGroups = groups.filter((g) => g.activity !== "kitesurf" && g.activity !== "wingfoil");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gestion des journées | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Gestion des journées</h1>
            <p className="text-sm text-muted-foreground">Vue par jour · groupes dynamiques Kite (4) / Wing (3)</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Rafraîchir
          </Button>
        </div>

        {/* Sélecteur de jour (semaine glissante) */}
        <Card className="p-3 mb-6 flex items-center gap-2 overflow-x-auto">
          <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {weekDays.map((d) => {
            const active = isSameDay(d, date);
            return (
              <Button
                key={d.toISOString()}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setDate(d)}
                className="flex-shrink-0 flex-col h-auto py-2 px-3"
              >
                <span className="text-xs">{format(d, "EEE", { locale: fr })}</span>
                <span className="text-lg font-bold">{format(d, "dd")}</span>
                <span className="text-xs">{format(d, "MMM", { locale: fr })}</span>
              </Button>
            );
          })}
          <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(date, "dd MMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} locale={fr} initialFocus />
            </PopoverContent>
          </Popover>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : groups.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aucune inscription pour cette journée.
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityColumn title="Kitesurf" icon={<Wind className="w-5 h-5" />} groups={kiteGroups}
              onEdit={setEditGroup} onCancel={handleCancelGroup}
              onRemove={handleRemoveMember}
              onRecredit={setRecreditMember}
              onCancelGroupRecredit={setRecreditGroup}
              onMove={(m, g) => { setMoveMember({ member: m, group: g }); setMoveDate(undefined); }} />
            <ActivityColumn title="Wingfoil" icon={<Waves className="w-5 h-5" />} groups={wingGroups}
              onEdit={setEditGroup} onCancel={handleCancelGroup}
              onRemove={handleRemoveMember}
              onRecredit={setRecreditMember}
              onCancelGroupRecredit={setRecreditGroup}
              onMove={(m, g) => { setMoveMember({ member: m, group: g }); setMoveDate(undefined); }} />
            {otherGroups.length > 0 && (
              <ActivityColumn title="Autres activités" icon={<Users className="w-5 h-5" />} groups={otherGroups}
                onEdit={setEditGroup} onCancel={handleCancelGroup}
                onRemove={handleRemoveMember}
                onRecredit={setRecreditMember}
                onCancelGroupRecredit={setRecreditGroup}
                onMove={(m, g) => { setMoveMember({ member: m, group: g }); setMoveDate(undefined); }} />
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Dialog édition groupe */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>
              {editGroup && `${ACTIVITY_LABEL[editGroup.activity]} · Groupe #${editGroup.group_index}`}
            </DialogDescription>
          </DialogHeader>
          {editGroup && (
            <div className="space-y-4">
              <div>
                <Label>Capacité maximale</Label>
                <Input type="number" min={1} max={10} value={editGroup.max_participants}
                  onChange={(e) => setEditGroup({ ...editGroup, max_participants: parseInt(e.target.value) || 1 })} />
                <p className="text-xs text-muted-foreground mt-1">
                  Occupation actuelle : {editGroup.taken}. Défaut : Kite 4 / Wing 3.
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <div className="flex gap-2 mt-1">
                  {(["open", "closed", "cancelled"] as const).map((s) => (
                    <Button key={s} type="button" size="sm"
                      variant={editGroup.status === s ? "default" : "outline"}
                      onClick={() => setEditGroup({ ...editGroup, status: s })}>
                      {s === "open" ? "Ouvert" : s === "closed" ? "Fermé" : "Annulé"}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Notes internes</Label>
                <Textarea value={editGroup.notes || ""} onChange={(e) => setEditGroup({ ...editGroup, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>Annuler</Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog déplacement membre */}
      <Dialog open={!!moveMember} onOpenChange={(o) => !o && setMoveMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déplacer une inscription</DialogTitle>
            <DialogDescription>
              {moveMember && `${moveMember.member.name} — ${ACTIVITY_LABEL[moveMember.group.activity]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Calendar mode="single" selected={moveDate} onSelect={setMoveDate} locale={fr}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveMember(null)}>Annuler</Button>
            <Button onClick={handleMove} disabled={!moveDate}>Déplacer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ActivityColumn = ({
  title, icon, groups, onEdit, onCancel, onRemove, onMove,
}: {
  title: string;
  icon: JSX.Element;
  groups: DailyGroup[];
  onEdit: (g: DailyGroup) => void;
  onCancel: (g: DailyGroup) => void;
  onRemove: (m: Member) => void;
  onMove: (m: Member, g: DailyGroup) => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl font-display font-bold">{title}</h2>
      <Badge variant="secondary">{groups.length} groupe{groups.length > 1 ? "s" : ""}</Badge>
    </div>
    {groups.length === 0 && (
      <Card className="p-4 text-sm text-muted-foreground">Aucun groupe.</Card>
    )}
    {groups.map((g) => (
      <Card key={g.id} className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">Groupe #{g.group_index}</h3>
              <Badge className={cn("border", STATUS_STYLES[g.status])} variant="outline">
                {g.status === "open" ? "Ouvert" : g.status === "closed" ? "Fermé" : "Annulé"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {g.taken}/{g.max_participants} places
              </span>
            </div>
            {g.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{g.notes}</p>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(g)} title="Modifier">
              <Settings2 className="w-4 h-4" />
            </Button>
            {g.status !== "cancelled" && (
              <Button variant="ghost" size="icon" onClick={() => onCancel(g)} title="Annuler le groupe">
                <Ban className="w-4 h-4 text-rose-600" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {g.members.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun participant</p>
          ) : (
            g.members.map((m) => (
              <div key={`${m.kind}-${m.id}`} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{m.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {m.kind === "package" ? `Pack ${m.package_code}` : `${m.participants} pers.`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {m.email} {m.phone && `· ${m.phone}`}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => onMove(m, g)} title="Déplacer">
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(m)} title="Retirer">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    ))}
  </div>
);

export default AdminJournees;