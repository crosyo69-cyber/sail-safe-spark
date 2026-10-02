import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { REMINDER_ROWS } from "../constants";
import type { ReminderPrefs } from "../types";

interface Props {
  reminders: ReminderPrefs;
  saving: boolean;
  onChange: (next: ReminderPrefs) => void;
}

export const ReminderPreferences = ({ reminders, saving, onChange }: Props) => (
  <section id="rappels" className="scroll-mt-24">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-primary" /> Rappels d'expiration par email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choisissez quand nous devons vous prévenir avant l'expiration de vos séances.
          Vous pouvez tout désactiver à tout moment.
        </p>
        {REMINDER_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 rounded-md border p-3"
          >
            <Label htmlFor={row.key} className="text-sm font-normal cursor-pointer">
              {row.label}
            </Label>
            <Switch
              id={row.key}
              checked={reminders[row.key]}
              disabled={saving}
              onCheckedChange={(v) => onChange({ ...reminders, [row.key]: v })}
            />
          </div>
        ))}
        {!reminders.remind_30 && !reminders.remind_7 && !reminders.remind_0 && (
          <p className="text-xs flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-muted-foreground">
            <BellOff className="w-4 h-4 shrink-0" />
            Tous les rappels sont désactivés : vos séances peuvent expirer sans avertissement.
          </p>
        )}
        <div className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Gérez aussi les informations que vous souhaitez recevoir (activités, météo,
            promotions, événements).
          </p>
          <Link
            to="/preferences-marketing"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md border text-sm font-medium hover:bg-muted"
          >
            Mes préférences marketing
          </Link>
        </div>
      </CardContent>
    </Card>
  </section>
);