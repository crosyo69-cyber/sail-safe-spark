import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { Loader2, Wind, Waves, Users, RefreshCw, CalendarX } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminJournees } from "@/hooks/admin/useAdminJournees";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecreditDialog, RECREDIT_REASONS } from "@/components/admin/RecreditDialog";
import { ActivityColumn } from "@/components/admin/journees/ActivityColumn";
import { WeekDayPicker } from "@/components/admin/journees/WeekDayPicker";
import { EditGroupDialog } from "@/components/admin/journees/EditGroupDialog";
import { MoveMemberDialog } from "@/components/admin/journees/MoveMemberDialog";
import { ACTIVITY_LABEL, type DailyGroup, type Member } from "@/features/admin-journees/types";

const AdminJournees = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const {
    date, setDate, groups, loading, busyDay, reload,
    handleCancelGroup, handleRemoveMember, handleCancelAndRecredit,
    handleCancelGroupAndRecredit, handleCancelDay, handleMove, handleSaveEdit,
  } = useAdminJournees(isAdmin);

  const [editGroup, setEditGroup] = useState<DailyGroup | null>(null);
  const [moveMember, setMoveMember] = useState<{ member: Member; group: DailyGroup } | null>(null);
  const [moveDate, setMoveDate] = useState<Date | undefined>(undefined);
  const [recreditMember, setRecreditMember] = useState<Member | null>(null);
  const [recreditGroup, setRecreditGroup] = useState<DailyGroup | null>(null);
  const [moveReason, setMoveReason] = useState(RECREDIT_REASONS[0].value);
  const [cancelDayOpen, setCancelDayOpen] = useState(false);

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

  const columnActions = {
    onEdit: setEditGroup,
    onCancel: handleCancelGroup,
    onRemove: handleRemoveMember,
    onRecredit: setRecreditMember,
    onCancelGroupRecredit: setRecreditGroup,
    onMove: (m: Member, g: DailyGroup) => { setMoveMember({ member: m, group: g }); setMoveDate(undefined); },
  };

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Rafraîchir
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDayOpen(true)}
              disabled={busyDay || groups.length === 0}
            >
              <CalendarX className="w-4 h-4 mr-2" />
              Annuler cette journée
            </Button>
          </div>
        </div>

        <WeekDayPicker date={date} onDateChange={setDate} />

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : groups.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aucune inscription pour cette journée.
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityColumn title="Kitesurf" icon={<Wind className="w-5 h-5" />} groups={kiteGroups} {...columnActions} />
            <ActivityColumn title="Wingfoil" icon={<Waves className="w-5 h-5" />} groups={wingGroups} {...columnActions} />
            {otherGroups.length > 0 && (
              <ActivityColumn title="Autres activités" icon={<Users className="w-5 h-5" />} groups={otherGroups} {...columnActions} />
            )}
          </div>
        )}
      </main>
      <Footer />

      <RecreditDialog
        open={!!recreditMember}
        onOpenChange={(o) => !o && setRecreditMember(null)}
        title="Annuler et recréditer"
        fixedSessions={1}
        confirmLabel="Annuler et recréditer"
        description={recreditMember && (
          <>
            {recreditMember.name}
            {recreditMember.kind === "package"
              ? <> — Pack <span className="font-mono">{recreditMember.package_code}</span>. La place sera libérée et 1 séance recréditée.</>
              : " — visiteur sans pack : l'inscription sera annulée, aucun crédit n'est ajouté."}
          </>
        )}
        onConfirm={async ({ reason }) => {
          if (!recreditMember) return;
          const okDone = await handleCancelAndRecredit(recreditMember, reason);
          if (okDone) setRecreditMember(null);
        }}
      />

      <RecreditDialog
        open={!!recreditGroup}
        onOpenChange={(o) => !o && setRecreditGroup(null)}
        title="Annuler la journée et recréditer"
        fixedSessions={1}
        confirmLabel="Annuler et recréditer le groupe"
        description={recreditGroup && (
          <>
            {ACTIVITY_LABEL[recreditGroup.activity]} · Groupe #{recreditGroup.group_index} —
            {" "}tous les clients avec pack seront recrédités d'une séance et prévenus par email.
          </>
        )}
        onConfirm={async ({ reason }) => {
          if (!recreditGroup) return;
          const okDone = await handleCancelGroupAndRecredit(recreditGroup, reason);
          if (okDone) setRecreditGroup(null);
        }}
      />

      <RecreditDialog
        open={cancelDayOpen}
        onOpenChange={(o) => !o && setCancelDayOpen(false)}
        title={`Annuler la journée du ${format(date, "dd/MM/yyyy")}`}
        fixedSessions={1}
        confirmLabel="Annuler toute la journée"
        description={
          <>
            Tous les groupes de la journée seront annulés : chaque client avec pack sera recrédité,
            les visiteurs seront prévenus, et toutes les places seront libérées.
          </>
        }
        onConfirm={async ({ reason }) => {
          const okDone = await handleCancelDay(reason);
          if (okDone) setCancelDayOpen(false);
        }}
      />

      <EditGroupDialog
        group={editGroup}
        onGroupChange={setEditGroup}
        onSave={async () => {
          if (!editGroup) return;
          const okDone = await handleSaveEdit(editGroup);
          if (okDone) setEditGroup(null);
        }}
      />

      <MoveMemberDialog
        target={moveMember}
        onClose={() => setMoveMember(null)}
        moveDate={moveDate}
        onMoveDateChange={setMoveDate}
        reason={moveReason}
        onReasonChange={setMoveReason}
        onConfirm={async () => {
          if (!moveMember || !moveDate) return;
          const okDone = await handleMove(moveMember.member, moveDate, moveReason);
          if (okDone) { setMoveMember(null); setMoveDate(undefined); }
        }}
      />
    </div>
  );
};

export default AdminJournees;
