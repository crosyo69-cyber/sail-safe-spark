import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, X, Check } from "lucide-react";

interface ReservationData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  participants: number;
  skill_level: string;
  status: string;
}

interface CalendarReservationActionsProps {
  reservation: ReservationData;
  onUpdated: () => void;
}

const SKILL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmé",
  pending: "En attente",
  cancelled: "Annulé",
};

const CalendarReservationActions = ({
  reservation,
  onUpdated,
}: CalendarReservationActionsProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    first_name: reservation.first_name,
    last_name: reservation.last_name,
    email: reservation.email,
    phone: reservation.phone,
    participants: reservation.participants,
    skill_level: reservation.skill_level,
    status: reservation.status,
  });

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("reservations")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        participants: form.participants,
        skill_level: form.skill_level as "debutant" | "intermediaire" | "confirme",
        status: form.status as "pending" | "confirmed" | "cancelled",
      })
      .eq("id", reservation.id);

    setSaving(false);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(`${form.first_name} ${form.last_name} mis(e) à jour`);
      setEditing(false);
      onUpdated();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservation.id);

    setDeleting(false);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(`Inscription de ${reservation.first_name} ${reservation.last_name} supprimée`);
      onUpdated();
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          onClick={() => setEditing(true)}
          title="Modifier"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'inscription ?</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer l'inscription de{" "}
                <strong>{reservation.first_name} {reservation.last_name}</strong> ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="col-span-full border border-primary/20 rounded-lg bg-primary/5 p-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">
          Modifier — {reservation.first_name} {reservation.last_name}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-6 w-6 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[10px]">Prénom</Label>
          <Input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Nom</Label>
          <Input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Téléphone</Label>
          <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Participants</Label>
          <Input type="number" min={1} max={10} value={form.participants} onChange={(e) => updateField("participants", parseInt(e.target.value) || 1)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">Niveau</Label>
          <Select value={form.skill_level} onValueChange={(v) => updateField("skill_level", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SKILL_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Statut</Label>
          <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>Annuler</Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarReservationActions;
