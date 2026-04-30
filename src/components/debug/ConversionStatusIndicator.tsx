import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RefreshCw, X } from "lucide-react";

type FireRecord = {
  fired: boolean;
  timestamp: number | null;
  source: "localStorage" | "sessionStorage" | "dom" | "none";
  key: string;
};

type ConversionStatus = {
  googleAds: FireRecord;
  gtmMerci: FireRecord;
  metaLead: FireRecord;
  metaCompleteRegistration: FireRecord;
};

const ADS_CONVERSION_ID = "s2n0CL3puI4cEIW4u9AD";

function readKey(
  storage: Storage | null,
  key: string,
  source: "localStorage" | "sessionStorage",
): FireRecord {
  if (!storage) return { fired: false, timestamp: null, source: "none", key };
  try {
    const raw = storage.getItem(key);
    if (!raw) return { fired: false, timestamp: null, source, key };
    const ts = Number(raw);
    return {
      fired: true,
      timestamp: Number.isFinite(ts) ? ts : null,
      source,
      key,
    };
  } catch {
    return { fired: false, timestamp: null, source: "none", key };
  }
}

function readDomMarker(id: string, key: string): FireRecord {
  if (typeof document === "undefined")
    return { fired: false, timestamp: null, source: "none", key };
  const el = document.getElementById(id);
  if (!el) return { fired: false, timestamp: null, source: "dom", key };
  const count = Number(el.getAttribute("data-count") || "0");
  return {
    fired: count > 0,
    timestamp: null,
    source: "dom",
    key: `${key} (×${count})`,
  };
}

function snapshot(): ConversionStatus {
  const ls = typeof window !== "undefined" ? window.localStorage : null;
  const ss = typeof window !== "undefined" ? window.sessionStorage : null;
  return {
    googleAds: readKey(ls, `conversion_fired_${ADS_CONVERSION_ID}`, "localStorage"),
    gtmMerci: readKey(
      ls,
      `conversion_fired_gtm_merci_${ADS_CONVERSION_ID}`,
      "localStorage",
    ),
    metaLead: readKey(ls, "conversion_fired_meta_lead", "localStorage"),
    metaCompleteRegistration: readKey(
      ss,
      "conversion_fired_meta_completeregistration",
      "sessionStorage",
    ),
  };
}

function formatRelative(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 1000) return "à l'instant";
  if (diff < 60_000) return `il y a ${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)}min`;
  return new Date(ts).toLocaleTimeString();
}

function StatusRow({ label, record }: { label: string; record: FireRecord }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        {record.fired ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{label}</div>
          <div className="text-muted-foreground truncate font-mono text-[10px]">
            {record.key}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className={
            record.fired
              ? "text-emerald-500 font-semibold"
              : "text-muted-foreground"
          }
        >
          {record.fired ? "FIRED" : "idle"}
        </div>
        <div className="text-muted-foreground text-[10px]">
          {formatRelative(record.timestamp)}
        </div>
      </div>
    </div>
  );
}

export function ConversionStatusIndicator() {
  const [status, setStatus] = useState<ConversionStatus>(() => snapshot());
  const [domMarkers, setDomMarkers] = useState({
    lead: readDomMarker("__fbq-marker-Lead", "fbq Lead"),
    cr: readDomMarker(
      "__fbq-marker-CompleteRegistration",
      "fbq CompleteRegistration",
    ),
  });
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const tick = () => {
      setStatus(snapshot());
      setDomMarkers({
        lead: readDomMarker("__fbq-marker-Lead", "fbq Lead"),
        cr: readDomMarker(
          "__fbq-marker-CompleteRegistration",
          "fbq CompleteRegistration",
        ),
      });
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full px-3 py-2 text-xs font-mono shadow-lg"
        aria-label="Ouvrir l'indicateur de conversion"
      >
        debug ▴
      </button>
    );
  }

  const records: Array<[string, FireRecord]> = [
    ["Google Ads (gtag)", status.googleAds],
    ["GTM merci_conversion", status.gtmMerci],
    ["Meta Pixel — Lead", status.metaLead],
    ["Meta Pixel — CompleteRegistration", status.metaCompleteRegistration],
    ["DOM marker Lead", domMarkers.lead],
    ["DOM marker CompleteRegistration", domMarkers.cr],
  ];

  const firedCount = records.filter(([, r]) => r.fired).length;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl"
      data-testid="conversion-status-indicator"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin [animation-duration:3s]" />
          <span className="text-xs font-semibold text-foreground">
            Conversions ({firedCount}/{records.length})
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-3 py-1 divide-y divide-border/50">
        {records.map(([label, record]) => (
          <StatusRow key={label} label={label} record={record} />
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground font-mono">
        polling 500ms · ?debug=0 pour masquer
      </div>
    </div>
  );
}

export default ConversionStatusIndicator;