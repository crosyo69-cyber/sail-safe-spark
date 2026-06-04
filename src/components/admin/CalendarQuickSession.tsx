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
import { toast } from "sonner";
import { Loader2, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";
type TimeSlot = "morning" | "early_afternoon" | "late_afternoon";
type SkillLevel = "debutant" | "intermediaire" | "confirme";

interface CalendarQuickSessionProps {
  date: string;
  onClose: () => void;
  onCreated: () => void;
}

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const SKILL_LABELS: Record<SkillLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const MAX_BY_ACTIVITY: Record<Activity, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
};

const CalendarQuickSession = ({ date, onClose, onCreated }: CalendarQuickSessionProps) => {
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<Activity>("kitesurf");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [addReservation, setAddReservation] = useState(true);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    participants: 1,
    skill_level: "debutant" as SkillLevel,
    notes: "",
  });

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const dateLabel = format(new Date(date + "T12:00:00"), "EEEE d MMMM", { locale: fr });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addReservation && (!form.first_name || !form.last_name || !form.email || !form.phone)) {
      toast.error("Veuillez remplir tous les champs obligatoires du stagiaire");
      return;
    }

    setSaving(true);

    // 1. Create session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        date,
        activity,
        time_slot: timeSlot,
        max_participants: MAX_BY_ACTIVITY[activity],
        status: "open",
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      setSaving(false);
      toast.error("Erreur lors de la création de la session : " + (sessionError?.message || "Erreur inconnue"));
      return;
    }

    // 2. Create reservation if requested
    if (addReservation) {
      const { error: resError } = await supabase.from("reservations").insert({
        session_id: sessionData.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        participants: form.participants,
        skill_level: form.skill_level,
        status: "confirmed",
        notes: form.notes || null,
      });

      if (resError) {
        setSaving(false);
        toast.error("Session créée mais erreur d'inscription : " + resError.message);
        onCreated();
        onClose();
        return;
      }

      // Fire and forget notification
      supabase.functions.invoke("notify-reservation", {
        body: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          participants: form.participants,
          skill_level: form.skill_level,
          activity,
          time_slot: timeSlot,
          date,
          source: "admin",
        },
      }).catch(() => {});

      toast.success(`Session créée et ${form.first_name} ${form.last_name} inscrit(e)`);
    } else {
      toast.success("Session créée avec succès");
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          <Plus className="w-4 h-4 inline mr-1" />
          Nouvelle session — <span className="capitalize">{dateLabel}</span>
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Session fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Activité *</Label>
            <Select value={activity} onValueChange={(v) => setActivity(v as Activity)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Créneau *</Label>
            <Select value={timeSlot} onValueChange={(v) => setTimeSlot(v as TimeSlot)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SLOT_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle reservation */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="add-reservation"
            checked={addReservation}
            onChange={(e) => setAddReservation(e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="add-reservation" className="text-xs cursor-pointer">
            Inscrire un stagiaire en même temps
          </Label>
        </div>

        {/* Reservation fields */}
        {addReservation && (
          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Prénom"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Nom"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@exemple.com"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Téléphone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="06 12 34 56 78"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Participants</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.participants}
                onChange={(e) => updateField("participants", parseInt(e.target.value) || 1)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Niveau</Label>
              <Select value={form.skill_level} onValueChange={(v) => updateField("skill_level", v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Notes (optionnel)</Label>
              <Input
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Remarques, allergies, etc."
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {addReservation ? "Créer session + inscrire" : "Créer la session"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CalendarQuickSession;
