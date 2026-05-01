import { useEffect, useState } from "react";
import { Send, SkipForward, Activity, RotateCcw } from "lucide-react";
import { trackGoogleAdsConversion } from "@/lib/analytics";

type LogEntry = {
  status: "sent" | "skipped";
  send_to: string;
  ts: number;
};

const EXPECTED_SEND_TO = "AW-974052357/s2n0CL3puI4cEIW4u9AD";
const CONVERSION_LABEL = "s2n0CL3puI4cEIW4u9AD";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("fr-FR", { hour12: false }) +
    "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function GoogleAdsConversionLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LogEntry>).detail;
      if (!detail) return;
      setEntries((prev) => [detail, ...prev].slice(0, 20));
    };
    window.addEventListener("ksp:gads-conversion", handler);
    return () => window.removeEventListener("ksp:gads-conversion", handler);
  }, []);

  const sentCount = entries.filter((e) => e.status === "sent").length;
  const skippedCount = entries.filter((e) => e.status === "skipped").length;

  const replay = () => {
    trackGoogleAdsConversion(CONVERSION_LABEL);
  };

  const forceReplay = () => {
    try {
      window.localStorage.removeItem(`conversion_fired_${EXPECTED_SEND_TO}`);
      window.sessionStorage.removeItem(`__gads_conv_${EXPECTED_SEND_TO}`);
    } catch {
      /* ignore */
    }
    trackGoogleAdsConversion(CONVERSION_LABEL);
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl"
      data-testid="gads-conversion-log"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Google Ads · conversion event
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          envoyés {sentCount} · dédup {skippedCount}
        </div>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <div className="text-[10px] text-muted-foreground font-mono">
          send_to attendu :
        </div>
        <div className="text-[11px] font-mono text-foreground break-all">
          {EXPECTED_SEND_TO}
        </div>
      </div>
      <div className="flex gap-2 px-3 py-2 border-b border-border">
        <button
          onClick={replay}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-md px-2 py-1.5 text-[11px] font-semibold min-h-[36px]"
          aria-label="Rejouer un test de conversion"
        >
          <RotateCcw className="w-3 h-3" />
          Rejouer un test
        </button>
        <button
          onClick={forceReplay}
          className="inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground hover:opacity-90 rounded-md px-2 py-1.5 text-[11px] font-semibold min-h-[36px]"
          aria-label="Forcer un envoi en réinitialisant la dédup"
          title="Vide la dédup puis rejoue (force ENVOYÉ)"
        >
          Forcer
        </button>
      </div>
      <div className="max-h-[240px] overflow-y-auto divide-y divide-border/50">
        {entries.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            En attente d'un événement <span className="font-mono">conversion</span>…
          </div>
        ) : (
          entries.map((e, i) => {
            const matches = e.send_to === EXPECTED_SEND_TO;
            return (
              <div
                key={`${e.ts}-${i}`}
                className="flex items-start gap-2 px-3 py-2 text-[11px]"
              >
                {e.status === "sent" ? (
                  <Send className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <SkipForward className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={
                        e.status === "sent"
                          ? "font-semibold text-emerald-500"
                          : "font-semibold text-amber-500"
                      }
                    >
                      {e.status === "sent" ? "ENVOYÉ" : "DÉDUPLIQUÉ"}
                    </span>
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {formatTime(e.ts)}
                    </span>
                  </div>
                  <div
                    className={`font-mono text-[10px] break-all ${
                      matches ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    send_to: {e.send_to}
                    {!matches && " ⚠ id inattendu"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground font-mono">
        écoute window event « ksp:gads-conversion »
      </div>
    </div>
  );
}

export default GoogleAdsConversionLog;