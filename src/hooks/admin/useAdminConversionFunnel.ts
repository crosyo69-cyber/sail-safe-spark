import { useEffect, useMemo, useRef, useState } from "react";
import { useAnalytics } from "@/hooks/services/useAnalytics";
import { analyticsService } from "@/services/analytics.service";
import {
  DEBUG_FILTERS_STORAGE_KEY,
  RANGES,
  computeStats,
  debugFiltersSchema,
  type DebugFilters,
  type EventFilter,
  type LiveEvent,
  type RangeKey,
} from "@/features/admin-conversion-funnel/types";

/**
 * Logique de présentation du tunnel de conversion :
 * plage temporelle, mode debug temps réel, filtres persistés et import JSON.
 */
export const useAdminConversionFunnel = () => {
  const { useConversionEvents } = useAnalytics();

  const [range, setRange] = useState<RangeKey>("7d");
  const hours = RANGES.find((r) => r.key === range)?.hours ?? 168;
  const eventsQuery = useConversionEvents(hours);
  const rows = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const [debug, setDebug] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("idle");

  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [pageSearch, setPageSearch] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<DebugFilters | null>(null);
  const originalImportRef = useRef<DebugFilters | null>(null);

  // Restauration des filtres debug
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEBUG_FILTERS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<DebugFilters>;
        if (saved.eventFilter) setEventFilter(saved.eventFilter);
        if (saved.pageSearch !== undefined) setPageSearch(saved.pageSearch);
        if (saved.sortNewest !== undefined) setSortNewest(saved.sortNewest);
        if (saved.dateFrom !== undefined) setDateFrom(saved.dateFrom);
        if (saved.dateTo !== undefined) setDateTo(saved.dateTo);
        if (saved.appliedDateFrom !== undefined) setAppliedDateFrom(saved.appliedDateFrom);
        if (saved.appliedDateTo !== undefined) setAppliedDateTo(saved.appliedDateTo);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persistance des filtres debug
  useEffect(() => {
    localStorage.setItem(
      DEBUG_FILTERS_STORAGE_KEY,
      JSON.stringify({
        eventFilter,
        pageSearch,
        sortNewest,
        dateFrom,
        dateTo,
        appliedDateFrom,
        appliedDateTo,
      }),
    );
  }, [eventFilter, pageSearch, sortNewest, dateFrom, dateTo, appliedDateFrom, appliedDateTo]);

  // Temps réel (mode debug uniquement)
  useEffect(() => {
    if (!debug) {
      setRealtimeStatus("idle");
      return;
    }
    setRealtimeStatus("connecting");
    const unsubscribe = analyticsService.subscribeConversionEvents(
      (ev) => setLiveEvents((prev) => [ev, ...prev].slice(0, 50)),
      (status) => setRealtimeStatus(status),
    );
    return unsubscribe;
  }, [debug]);

  const stats = useMemo(() => computeStats(rows), [rows]);

  const filteredEvents = useMemo(() => {
    let list = [...liveEvents];
    if (eventFilter !== "all") {
      list = list.filter((ev) => ev.event_type === eventFilter);
    }
    if (pageSearch.trim()) {
      const q = pageSearch.trim().toLowerCase();
      list = list.filter((ev) => (ev.page_path || "/").toLowerCase().includes(q));
    }
    if (appliedDateFrom) {
      const from = new Date(appliedDateFrom).getTime();
      list = list.filter((ev) => new Date(ev.created_at).getTime() >= from);
    }
    if (appliedDateTo) {
      const to = new Date(appliedDateTo).getTime();
      list = list.filter((ev) => new Date(ev.created_at).getTime() <= to);
    }
    if (!sortNewest) {
      list = list
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return list;
  }, [liveEvents, eventFilter, pageSearch, sortNewest, appliedDateFrom, appliedDateTo]);

  const applyDates = () => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const resetFilters = () => {
    setEventFilter("all");
    setPageSearch("");
    setSortNewest(true);
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setImportError(null);
    setPendingImport(null);
    localStorage.removeItem(DEBUG_FILTERS_STORAGE_KEY);
  };

  const handleImport = (file: File) => {
    setImportError(null);
    setPendingImport(null);
    originalImportRef.current = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const result = debugFiltersSchema.safeParse(raw);
        if (!result.success) {
          const issues = result.error.errors
            .map((err) => `  • ${err.path.join(".") || "racine"} — ${err.message}`)
            .join("\n");
          setImportError(`Le fichier JSON est invalide :\n${issues}`);
          return;
        }
        setPendingImport(result.data);
        originalImportRef.current = result.data;
      } catch {
        setImportError("Impossible de lire le fichier. Vérifiez qu'il s'agit d'un JSON valide.");
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    setEventFilter(pendingImport.eventFilter);
    setPageSearch(pendingImport.pageSearch);
    setSortNewest(pendingImport.sortNewest);
    setDateFrom(pendingImport.dateFrom);
    setDateTo(pendingImport.dateTo);
    setAppliedDateFrom(pendingImport.appliedDateFrom);
    setAppliedDateTo(pendingImport.appliedDateTo);
    setPendingImport(null);
    originalImportRef.current = null;
  };

  const cancelImport = () => {
    setPendingImport(null);
    originalImportRef.current = null;
  };

  const resetImportEdits = () => {
    if (originalImportRef.current) setPendingImport(originalImportRef.current);
  };

  return {
    range,
    setRange,
    loading: eventsQuery.isLoading,
    error: eventsQuery.error ? (eventsQuery.error as Error).message : null,
    stats,

    debug,
    setDebug,
    realtimeStatus,
    liveEvents,
    clearLiveEvents: () => setLiveEvents([]),
    filteredEvents,

    filters: {
      eventFilter,
      setEventFilter,
      pageSearch,
      setPageSearch,
      sortNewest,
      toggleSort: () => setSortNewest((s) => !s),
      dateFrom,
      setDateFrom,
      dateTo,
      setDateTo,
      applyDates,
      resetFilters,
    },

    importState: {
      importError,
      pendingImport,
      setPendingImport,
      handleImport,
      confirmImport,
      cancelImport,
      resetImportEdits,
    },
  };
};

export type AdminConversionFunnelController = ReturnType<typeof useAdminConversionFunnel>;