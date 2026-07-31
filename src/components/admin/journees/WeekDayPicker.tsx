import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  date: Date;
  onDateChange: (d: Date) => void;
}

export const WeekDayPicker = ({ date, onDateChange }: Props) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <Card className="p-3 mb-6 flex items-center gap-2 overflow-x-auto">
      <Button variant="ghost" size="icon" onClick={() => onDateChange(addDays(date, -7))}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {weekDays.map((d) => {
        const active = isSameDay(d, date);
        return (
          <Button
            key={d.toISOString()}
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => onDateChange(d)}
            className="flex-shrink-0 flex-col h-auto py-2 px-3"
          >
            <span className="text-xs">{format(d, "EEE", { locale: fr })}</span>
            <span className="text-lg font-bold">{format(d, "dd")}</span>
            <span className="text-xs">{format(d, "MMM", { locale: fr })}</span>
          </Button>
        );
      })}
      <Button variant="ghost" size="icon" onClick={() => onDateChange(addDays(date, 7))}>
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
          <Calendar mode="single" selected={date} onSelect={(d) => d && onDateChange(d)} locale={fr} initialFocus />
        </PopoverContent>
      </Popover>
    </Card>
  );
};
