import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw, Plus, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

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
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
  expired: "outline",
};

const AdminPackagesManager = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_packages")
      .select("*")
      .order("created_at", { ascending: false });
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

  const adjustSessions = async (p: Pkg, delta: number) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from("client_packages")
      .update({ total_sessions: Math.max(p.used_sessions, p.total_sessions + delta) })
      .eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Crédits ajustés");
    load();
  };

  const setStatus = async (p: Pkg, status: string) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from("client_packages")
      .update({ status })
      .eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Statut mis à jour");
    load();
  };

  const filtered = packages.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      p.package_code.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.activity.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrer par code, email, nom, activité…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} pack{filtered.length > 1 ? "s" : ""}
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
                  <TableHead>Code</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Acompte</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.package_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                      {p.phone && <div className="text-xs text-muted-foreground">{p.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.activity}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{p.package_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={busyId === p.id}
                          onClick={() => adjustSessions(p, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-semibold tabular-nums">
                          {p.total_sessions - p.used_sessions}/{p.total_sessions}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={busyId === p.id}
                          onClick={() => adjustSessions(p, +1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.deposit_amount ? `${p.deposit_amount}€` : "-"}
                      {p.deposit_paid_at && (
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(p.deposit_paid_at), "d MMM yyyy", { locale: fr })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(p.expires_at), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] || "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {p.status === "active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setStatus(p, "cancelled")}
                            disabled={busyId === p.id}
                          >
                            Annuler
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setStatus(p, "active")}
                            disabled={busyId === p.id}
                          >
                            Réactiver
                          </Button>
                        )}
                        <a
                          href={`/mon-espace/${p.package_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline text-center"
                        >
                          Voir l'espace
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun pack
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

export default AdminPackagesManager;