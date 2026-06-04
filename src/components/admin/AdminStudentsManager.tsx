import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, RefreshCw, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type SortField = "name" | "remaining" | "updated";
type SortDir = "asc" | "desc";

interface Pkg {
  id: string;
  package_code: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  activity: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
  expires_at: string;
  updated_at: string;
  created_at: string;
}

interface Student {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  totalRemaining: number;
  remainingByActivity: Record<string, number>;
  activePackages: Pkg[];
  allPackages: Pkg[];
  lastUpdated: string;
}

const AdminStudentsManager = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [packStatusFilter, setPackStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_packages")
      .select(
        "id, package_code, email, first_name, last_name, phone, activity, package_type, total_sessions, used_sessions, status, expires_at, updated_at, created_at",
      )
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
      return;
    }
    setPackages((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const students = useMemo<Student[]>(() => {
    const map = new Map<string, Student>();
    for (const p of packages) {
      const key = p.email.toLowerCase();
      let s = map.get(key);
      if (!s) {
        s = {
          email: p.email,
          firstName: p.first_name,
          lastName: p.last_name,
          phone: p.phone,
          totalRemaining: 0,
          remainingByActivity: {},
          activePackages: [],
          allPackages: [],
          lastUpdated: p.updated_at,
        };
        map.set(key, s);
      }
      s.allPackages.push(p);
      if (p.updated_at > s.lastUpdated) s.lastUpdated = p.updated_at;
      const remaining = Math.max(p.total_sessions - p.used_sessions, 0);
      const isActive =
        p.status === "active" && remaining > 0 && parseISO(p.expires_at) >= new Date();
      if (isActive) {
        s.activePackages.push(p);
        s.totalRemaining += remaining;
        s.remainingByActivity[p.activity] =
          (s.remainingByActivity[p.activity] || 0) + remaining;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.lastUpdated < b.lastUpdated ? 1 : -1,
    );
  }, [packages]);

  const activities = useMemo(() => {
    const set = new Set<string>();
    for (const p of packages) {
      if (p.activity) set.add(p.activity);
    }
    return Array.from(set).sort();
  }, [packages]);

  const filtered = students.filter((s) => {
    const q = filter.toLowerCase().trim();
    const textMatch =
      !q ||
      s.email.toLowerCase().includes(q) ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q);

    const activityMatch =
      activityFilter === "all" ||
      s.activePackages.some((p) => p.activity === activityFilter);

    const statusMatch =
      packStatusFilter === "all" ||
      (packStatusFilter === "active" && s.totalRemaining > 0) ||
      (packStatusFilter === "expired" && s.totalRemaining === 0);

    return textMatch && activityMatch && statusMatch;
  });

  const totalActiveCredits = students.reduce((acc, s) => acc + s.totalRemaining, 0);
  const studentsWithCredits = students.filter((s) => s.totalRemaining > 0).length;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Élèves
            </div>
            <div className="text-2xl font-bold">{students.length}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Élèves avec crédits actifs
            </div>
            <div className="text-2xl font-bold">{studentsWithCredits}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Sessions restantes (total)
            </div>
            <div className="text-2xl font-bold text-primary">{totalActiveCredits}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Rechercher par nom, email, téléphone…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Activité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les activités</SelectItem>
              {activities.map((act) => (
                <SelectItem key={act} value={act}>
                  {act}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={packStatusFilter} onValueChange={setPackStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut pack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les packs</SelectItem>
              <SelectItem value="active">Pack actif</SelectItem>
              <SelectItem value="expired">Pack expiré</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilter("");
              setActivityFilter("all");
              setPackStatusFilter("all");
            }}
            disabled={!filter && activityFilter === "all" && packStatusFilter === "all"}
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} élève{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Pack actif</TableHead>
                  <TableHead className="text-right">Sessions restantes</TableHead>
                  <TableHead>Détail par activité</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.email}>
                    <TableCell>
                      <div className="font-medium">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                      {s.phone && (
                        <div className="text-xs text-muted-foreground">{s.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.activePackages.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Aucun pack actif
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {s.activePackages.map((p) => (
                            <div key={p.id} className="text-xs">
                              <a
                                href={`/mon-espace/${p.package_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-primary hover:underline"
                              >
                                {p.package_code}
                              </a>
                              <span className="text-muted-foreground">
                                {" "}
                                · {p.package_type} · expire le{" "}
                                {format(parseISO(p.expires_at), "d MMM yyyy", {
                                  locale: fr,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          s.totalRemaining === 0
                            ? "text-muted-foreground"
                            : s.totalRemaining === 1
                              ? "text-destructive"
                              : "text-primary"
                        }`}
                      >
                        {s.totalRemaining}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(s.remainingByActivity).map(([act, n]) => (
                          <Badge key={act} variant="outline" className="text-xs">
                            {act} : {n}
                          </Badge>
                        ))}
                        {Object.keys(s.remainingByActivity).length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(parseISO(s.lastUpdated), "d MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun élève
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminStudentsManager;