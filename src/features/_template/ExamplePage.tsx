/**
 * TEMPLATE — Page (à déplacer dans `src/pages/AdminExample.tsx`).
 * Rôle : composition uniquement. Un seul hook admin, aucun appel réseau.
 */
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ExampleTable } from "./components/ExampleTable";
import { useAdminExample } from "./useAdminExample";

export default function ExamplePage() {
  const { loading, rows, stats, search, setSearch, handleNotify } = useAdminExample();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-display font-semibold text-foreground">Module exemple</h1>
        <p className="text-sm text-muted-foreground">
          {stats.total} éléments — {stats.completionRate}% terminés
        </p>
      </header>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher…"
        className="max-w-sm"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <ExampleTable rows={rows} onNotify={handleNotify} />
      )}
    </div>
  );
}