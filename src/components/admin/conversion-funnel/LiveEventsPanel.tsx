import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowDownZA,
  Radio,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import type { EventFilter, LiveEvent } from "@/features/admin-conversion-funnel/types";
import { ImportFiltersDialog } from "./ImportFiltersDialog";
import type { AdminConversionFunnelController } from "@/hooks/admin/useAdminConversionFunnel";

interface Props {
  realtimeStatus: string;
  liveEvents: LiveEvent[];
  filteredEvents: LiveEvent[];
  clearLiveEvents: () => void;
  filters: AdminConversionFunnelController["filters"];
  importState: AdminConversionFunnelController["importState"];
}

export const LiveEventsPanel = ({
  realtimeStatus,
  liveEvents,
  filteredEvents,
  clearLiveEvents,
  filters,
  importState,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            Flux d'événements en direct
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={realtimeStatus === "SUBSCRIBED" ? "default" : "secondary"}
              className="font-mono text-[10px]"
            >
              {realtimeStatus}
            </Badge>
            <Button size="sm" variant="outline" onClick={clearLiveEvents} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Vider
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Select
            value={filters.eventFilter}
            onValueChange={(v) => filters.setEventFilter(v as EventFilter)}
          >
            <SelectTrigger className="w-[180px] text-xs h-8">
              <SelectValue placeholder="Tous les événements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les événements</SelectItem>
              <SelectItem value="phone_click">Clics téléphone</SelectItem>
              <SelectItem value="form_submit">Formulaires</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une page…"
              value={filters.pageSearch}
              onChange={(e) => filters.setPageSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button size="sm" variant="outline" onClick={filters.toggleSort} className="gap-1.5 h-8">
            {filters.sortNewest ? (
              <ArrowDownZA className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownAZ className="w-3.5 h-3.5" />
            )}
            <span className="text-xs">{filters.sortNewest ? "Plus récents" : "Plus anciens"}</span>
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={filters.dateFrom}
              onChange={(e) => filters.setDateFrom(e.target.value)}
              className="h-8 text-xs w-[170px]"
            />
            <span className="text-xs text-muted-foreground">à</span>
            <Input
              type="datetime-local"
              value={filters.dateTo}
              onChange={(e) => filters.setDateTo(e.target.value)}
              className="h-8 text-xs w-[170px]"
            />
            <Button size="sm" variant="default" className="h-8 text-xs" onClick={filters.applyDates}>
              Appliquer
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={filters.resetFilters}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importState.handleImport(file);
                if (e.target) e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              Importer
            </Button>
          </div>
        </div>
        {importState.importError && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line text-xs">
              {importState.importError}
            </AlertDescription>
          </Alert>
        )}
        <ImportFiltersDialog
          pendingImport={importState.pendingImport}
          setPendingImport={importState.setPendingImport}
          onConfirm={importState.confirmImport}
          onCancel={importState.cancelImport}
          onResetEdits={importState.resetImportEdits}
        />
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {liveEvents.length === 0
              ? "En attente d'événements… Cliquez sur un bouton téléphone ou envoyez un formulaire dans un autre onglet pour vérifier."
              : "Aucun événement ne correspond aux filtres sélectionnés."}
          </p>
        ) : (
          <ScrollArea className="h-[320px]">
            <ul className="divide-y divide-border/50">
              {filteredEvents.map((ev) => (
                <li key={ev.id} className="py-2 flex items-start gap-3 text-xs">
                  <Badge
                    variant={
                      ev.event_type === "form_submit"
                        ? "default"
                        : ev.event_type === "phone_click"
                          ? "secondary"
                          : "outline"
                    }
                    className="font-mono shrink-0"
                  >
                    {ev.event_type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-foreground truncate">
                      {ev.page_path || "/"}
                      {ev.location && (
                        <span className="text-muted-foreground"> · {ev.location}</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-[10px] font-mono">
                      session {ev.session_id.slice(0, 12)}… ·{" "}
                      {new Date(ev.created_at).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};