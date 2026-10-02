import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useReservations } from "@/hooks/services/useReservations";
import { ACTIVITY_LABEL, type DailyGroup, type Member } from "@/features/admin-journees/types";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Toute la logique métier de la page « Gestion des journées ».
 * Aucun accès direct à Supabase : uniquement reservation.service via useReservations().
 */
export const useAdminJournees = (enabled: boolean) => {
  const reservations = useReservations();

  const [date, setDate] = useState<Date>(new Date());
  const iso = format(date, "yyyy-MM-dd");

  const groupsQuery = reservations.useAdminGroups({ p_date: iso }, enabled);

  const updateGroup = reservations.useUpdateDailyGroup();
  const cancelGroup = reservations.useCancelDailyGroup();
  const cancelGroupRecredit = reservations.useCancelGroupAndRecredit();
  const cancelMemberRecredit = reservations.useCancelAndRecredit();
  const cancelDayMutation = reservations.useCancelDay();
  const removeMember = reservations.useRemoveGroupMember();
  const reschedule = reservations.useRescheduleBooking();

  const error = groupsQuery.error;
  useEffect(() => {
    if (error) toast.error("Erreur : " + msg(error));
  }, [error]);

  const groups = useMemo<DailyGroup[]>(
    () => (error ? [] : ((groupsQuery.data as DailyGroup[] | null) ?? [])),
    [groupsQuery.data, error],
  );

  const loading = groupsQuery.isFetching;
  const busyDay = cancelDayMutation.isPending;

  const reload = useCallback(() => {
    void groupsQuery.refetch();
  }, [groupsQuery]);

  const handleCancelGroup = async (g: DailyGroup) => {
    const reason = window.prompt(
      `Motif d'annulation du groupe ${ACTIVITY_LABEL[g.activity]} #${g.group_index} ?`,
    );
    if (reason === null) return;
    try {
      await cancelGroup.mutateAsync({ p_group_id: g.id, p_reason: reason || null });
      toast.success("Groupe annulé, crédits restitués");
    } catch (e) {
      toast.error(msg(e));
    }
  };

  const handleRemoveMember = async (m: Member) => {
    if (!confirm(`Retirer ${m.name} de ce groupe ?`)) return;
    try {
      await removeMember.mutateAsync({ p_kind: m.kind, p_id: m.id });
      toast.success("Inscription retirée");
    } catch (e) {
      toast.error(msg(e));
    }
  };

  const handleCancelAndRecredit = async (member: Member, reason: string) => {
    try {
      await cancelMemberRecredit.mutateAsync({
        p_kind: member.kind,
        p_id: member.id,
        p_reason: reason,
      });
      toast.success(
        member.kind === "package"
          ? "Inscription annulée et séance recréditée — email envoyé"
          : "Inscription visiteur annulée",
      );
      return true;
    } catch (e) {
      toast.error(msg(e));
      return false;
    }
  };

  const handleCancelGroupAndRecredit = async (group: DailyGroup, reason: string) => {
    try {
      const data = await cancelGroupRecredit.mutateAsync({
        p_group_id: group.id,
        p_reason: reason,
      });
      const n = (data as { recredited?: number } | null)?.recredited ?? 0;
      toast.success(`Journée annulée — ${n} séance(s) recréditée(s), emails envoyés`);
      return true;
    } catch (e) {
      toast.error(msg(e));
      return false;
    }
  };

  const handleCancelDay = async (reason: string) => {
    try {
      const data = await cancelDayMutation.mutateAsync({ p_date: iso, p_reason: reason });
      const res = data as { packages_recredited?: number; visitors_cancelled?: number } | null;
      toast.success(
        `Journée annulée — ${res?.packages_recredited ?? 0} pack(s) recrédité(s), ${res?.visitors_cancelled ?? 0} visiteur(s) prévenu(s)`,
      );
      return true;
    } catch (e) {
      toast.error(msg(e));
      return false;
    }
  };

  const handleMove = async (member: Member, newDate: Date, reason: string) => {
    try {
      await reschedule.mutateAsync({
        p_kind: member.kind,
        p_id: member.id,
        p_new_date: format(newDate, "yyyy-MM-dd"),
        p_reason: reason,
      });
      toast.success("Réservation reportée — email de confirmation envoyé");
      return true;
    } catch (e) {
      toast.error(msg(e));
      return false;
    }
  };

  const handleSaveEdit = async (group: DailyGroup) => {
    try {
      await updateGroup.mutateAsync({
        p_group_id: group.id,
        p_max_participants: group.max_participants,
        p_notes: group.notes,
        p_status: group.status,
      });
      toast.success("Groupe mis à jour");
      return true;
    } catch (e) {
      toast.error(msg(e));
      return false;
    }
  };

  return {
    date,
    setDate,
    groups,
    loading,
    busyDay,
    reload,
    handleCancelGroup,
    handleRemoveMember,
    handleCancelAndRecredit,
    handleCancelGroupAndRecredit,
    handleCancelDay,
    handleMove,
    handleSaveEdit,
  };
};
