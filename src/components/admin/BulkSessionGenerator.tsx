import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, CalendarPlus, Sparkles } from "lucide-react";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte";
type TimeSlot = "morning" | "early_afternoon" | "late_afternoon";

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

const MAX_PARTICIPANTS: Record<Activity, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 6,
  foil_tracte: 6,
  stage_100_glisse: 4,
};

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface BulkSessionGeneratorProps {
  onComplete: () => void;
}

const BulkSessionGenerator = ({ onComplete }: BulkSessionGeneratorProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Ven
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(["morning", "early_afternoon"]);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>(["kitesurf"]);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const toggleActivity = (activity: Activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const getSessionCount = () => {
    if (!startDate || !endDate || selectedDays.length === 0 || selectedSlots.length === 0 || selectedActivities.length === 0) return 0;
    const days = eachDayOfInterval({ start: startDate, end: endDate }).filter((d) =>
      selectedDays.includes(getDay(d))
    );
    return days.length * selectedSlots.length * selectedActivities.length;
  };

  const handleGenerate = async () => {
    if (getSessionCount() === 0) return;
    setLoading(true);

    const days = eachDayOfInterval({ start: startDate, end: endDate }).filter((d) =>
      selectedDays.includes(getDay(d))
    );

    const rows = days.flatMap((day) =>
      selectedSlots.flatMap((slot) =>
        selectedActivities.map((activity) => ({
          date: format(day, "yyyy-MM-dd"),
          time_slot: slot,
          activity,
          max_participants: MAX_PARTICIPANTS[activity],
        }))
      )
    );

    // Insert in batches to avoid conflicts (upsert-like: skip duplicates)
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const { error } = await supabase.from("sessions").insert(row);
      if (error) {
        if (error.code === "23505") {
          skipped++;
        } else {
          console.error("Error inserting session:", error);
          skipped++;
        }
      } else {
        created++;
      }
    }

    setLoading(false);
    toast({
      title: `${created} session${created > 1 ? "s" : ""} créée${created > 1 ? "s" : ""} ✓`,
      description: skipped > 0 ? `${skipped} session${skipped > 1 ? "s" : ""} existante${skipped > 1 ? "s" : ""} ignorée${skipped > 1 ? "s" : ""}` : undefined,
    });
    onComplete();
  };

  const sessionCount = getSessionCount();

  return (
    <Card className="p-6 space-y-6 border-primary/20">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground text-lg">Générer des sessions récurrentes</h3>
      </div>

      {/* Date range */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Date de début</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full gap-2 justify-start">
                <CalendarIcon className="w-4 h-4" />
                {format(startDate, "d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                locale={fr}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Date de fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full gap-2 justify-start">
                <CalendarIcon className="w-4 h-4" />
                {format(endDate, "d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => d && setEndDate(d)}
                locale={fr}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Days of week */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Jours de la semaine</label>
        <div className="flex gap-2 flex-wrap">
          {DAY_LABELS.map((label, i) => (
            <Button
              key={i}
              size="sm"
              variant={selectedDays.includes(i) ? "default" : "outline"}
              className="w-12 h-9"
              onClick={() => toggleDay(i)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Créneaux horaires</label>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(SLOT_LABELS) as TimeSlot[]).map((slot) => (
            <label key={slot} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedSlots.includes(slot)}
                onCheckedChange={() => toggleSlot(slot)}
              />
              <span className="text-sm text-foreground">{SLOT_LABELS[slot]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Activités</label>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((activity) => (
            <label key={activity} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedActivities.includes(activity)}
                onCheckedChange={() => toggleActivity(activity)}
              />
              <span className="text-sm text-foreground">{ACTIVITY_LABELS[activity]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Summary & Generate */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {sessionCount} session{sessionCount > 1 ? "s" : ""} à créer
          </Badge>
          {sessionCount > 100 && (
            <span className="text-xs text-muted-foreground">(cela peut prendre quelques secondes)</span>
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || sessionCount === 0}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création en cours…
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4" />
              Générer les sessions
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default BulkSessionGenerator;
