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
import { Loader2, X } from "lucide-react";

interface CalendarAddReservationProps {
  sessionId: string;
  activityLabel: string;
  activity: string;
  timeSlot: string;
  sessionDate: string;
  slotLabel: string;
  dateLabel: string;
  onClose: () => void;
  onAdded: () => void;
}

const SKILL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const CalendarAddReservation = ({
  sessionId,
  activityLabel,
  activity,
  timeSlot,
  sessionDate,
  slotLabel,
  dateLabel,
  onClose,
  onAdded,
}: CalendarAddReservationProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    participants: 1,
    skill_level: "debutant",
    notes: "",
  });

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.phone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("reservations").insert({
      session_id: sessionId,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      participants: form.participants,
      skill_level: form.skill_level as "debutant" | "intermediaire" | "confirme",
      status: "confirmed",
      notes: form.notes || null,
    });

    setSaving(false);

    if (error) {
      toast.error("Erreur lors de l'inscription : " + error.message);
    } else {
      toast.success(`${form.first_name} ${form.last_name} inscrit(e) avec succès`);
      // Send email notification (fire and forget)
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
          date: sessionDate,
          source: "admin",
        },
      }).catch(() => {});
      onAdded();
      onClose();
    }
  };

  return (
    <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Inscrire un stagiaire — {activityLabel} · {slotLabel} · {dateLabel}
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
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
        <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            Inscrire
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CalendarAddReservation;
