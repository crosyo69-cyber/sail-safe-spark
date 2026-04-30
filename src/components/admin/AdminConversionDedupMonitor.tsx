import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Trash2, RefreshCw } from "lucide-react";
import {
  CONVERSION_DEDUP_BLOCK_EVENT,
  CONVERSION_DEDUP_WINDOW_MS,
  clearAllDailyConversionFlags,
  clearConversionDedupBlockHistory,
  getConversionDedupBlockHistory,
  isConversionDedupDebugEnabled,
  setConversionDedupDebug,
  type ConversionDedupBlockEntry,
} from "@/lib/conversion-dedup";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

const AdminConversionDedupMonitor = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ConversionDedupBlockEntry[]>([]);
  const [debugEnabled, setDebugEnabled] = useState(false);

  const refresh = useCallback(() => {
    setEntries(getConversionDedupBlockHistory());
    setDebugEnabled(isConversionDedupDebugEnabled());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(CONVERSION_DEDUP_BLOCK_EVENT, handler);
    return () => window.removeEventListener(CONVERSION_DEDUP_BLOCK_EVENT, handler);
  }, [refresh]);

  const onToggleDebug = (next: boolean) => {
    setConversionDedupDebug(next);
    setDebugEnabled(isConversionDedupDebugEnabled());
    toast({
      title: next ? "Debug activé" : "Debug désactivé",
      description: next
        ? "Les blocages de conversion sont journalisés dans la console."
        : "Les logs détaillés sont coupés (l'historique reste enregistré).",
    });
  };

  const onClearHistory = () => {
    clearConversionDedupBlockHistory();
    refresh();
    toast({ title: "Historique vidé", description: "Les blocages enregistrés ont été supprimés." });
  };

  const onClearFlags = () => {
    clearAllDailyConversionFlags();
    toast({
      title: "Flags de conversion supprimés",
      description: "sessionStorage et localStorage ont été nettoyés.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Déduplication des conversions
            </CardTitle>
            <CardDescription>
              Derniers blocages enregistrés (CTA / merci) — fenêtre glissante de{" "}
              {CONVERSION_DEDUP_WINDOW_MS / 1000}s. Source : sessionStorage ou
              localStorage (miroir persistant).
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="dedup-debug-toggle"
                checked={debugEnabled}
                onCheckedChange={onToggleDebug}
              />
              <Label htmlFor="dedup-debug-toggle" className="text-sm">
                Mode debug
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onClearHistory} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Vider l'historique
          </Button>
          <Button variant="destructive" size="sm" onClick={onClearFlags} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Supprimer les flags actifs
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {entries.length} blocage{entries.length > 1 ? "s" : ""} enregistré
            {entries.length > 1 ? "s" : ""}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun blocage enregistré. Les nouveaux blocages apparaîtront ici en temps réel.
          </div>
        ) : (
          <ScrollArea className="h-[480px] rounded-md border">
            <ul className="divide-y">
              {entries.map((entry, idx) => (
                <li key={`${entry.blockedAt}-${idx}`} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.key}
                    </Badge>
                    {entry.mirrorKey && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        miroir : {entry.mirrorKey}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDateTime(entry.blockedAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge>{entry.source}</Badge>
                    <Badge variant="outline">
                      Dernier fire : {formatDateTime(entry.lastFiredAt)}
                    </Badge>
                    <Badge variant="outline">Âge : {entry.ageMs} ms</Badge>
                  </div>

                  {entry.url && (
                    <p className="text-xs text-muted-foreground break-all">
                      URL : <span className="font-mono">{entry.url}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminConversionDedupMonitor;
