import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Search, ArrowLeft, Megaphone, Archive, Copy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import CampaignEditor from "@/components/admin/CampaignEditor";
import {
  Campaign, CampaignStatus, EMPTY_AUDIENCE, STATUS_META, audienceSummary,
} from "@/components/admin/campaign-types";

const AdminCampagnes = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Chargement impossible", { description: error.message }); return; }
    setCampaigns(((data ?? []) as unknown as Campaign[]).map((c) => ({
      ...c,
      audience: { ...EMPTY_AUDIENCE, ...(c.audience ?? {}) },
    })));
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (!q || c.name.toLowerCase().includes(q) || (c.subject ?? "").toLowerCase().includes(q)),
    );
  }, [campaigns, search, statusFilter]);

  const archive = async (c: Campaign) => {
    const { error } = await supabase.from("marketing_campaigns").update({ status: "archived" }).eq("id", c.id);
    if (error) { toast.error("Archivage impossible", { description: error.message }); return; }
    toast.success("Campagne archivée");
    void load();
  };

  const duplicate = async (c: Campaign) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("marketing_campaigns").insert({
      name: `${c.name} (copie)`,
      subject: c.subject,
      preheader: c.preheader,
      content_html: c.content_html,
      hero_image_url: c.hero_image_url,
      cta_label: c.cta_label,
      cta_url: c.cta_url,
      status: "draft",
      audience: c.audience as unknown as never,
      recipients_count: c.recipients_count,
      created_by: userData.user?.id ?? null,
      created_by_email: userData.user?.email ?? null,
    });
    if (error) { toast.error("Duplication impossible", { description: error.message }); return; }
    toast.success("Campagne dupliquée");
    void load();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Campagnes | Kitesurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pb-12 pt-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-foreground">
              <Megaphone className="h-7 w-7 text-primary" />Campagnes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Création, sauvegarde et aperçu. Aucun email n'est envoyé à ce stade.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Administration</Link>
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Nouvelle campagne
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-wrap gap-3 py-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Rechercher une campagne…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {(Object.keys(STATUS_META) as CampaignStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">Aucune campagne pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Création</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead className="text-right">Destinataires</TableHead>
                      <TableHead>Créée par</TableHead>
                      <TableHead>Dernière modif.</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => { setEditing(c); setEditorOpen(true); }}>
                        <TableCell className="font-medium">
                          {c.name}
                          <div className="text-xs text-muted-foreground">{c.subject || "—"}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(parseISO(c.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={STATUS_META[c.status]?.className}>
                            {STATUS_META[c.status]?.label ?? c.status}
                          </Badge>
                          {c.status === "scheduled" && c.scheduled_at && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {format(parseISO(c.scheduled_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[240px] text-xs text-muted-foreground">{audienceSummary(c.audience)}</TableCell>
                        <TableCell className="text-right font-semibold">{c.recipients_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.created_by_email ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(parseISO(c.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          {c.updated_by_email ? <div>{c.updated_by_email}</div> : null}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label="Dupliquer" onClick={() => void duplicate(c)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {c.status !== "archived" && (
                              <Button variant="ghost" size="icon" aria-label="Archiver" onClick={() => void archive(c)}>
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      <CampaignEditor
        open={editorOpen}
        campaign={editing}
        onOpenChange={setEditorOpen}
        onSaved={() => void load()}
      />
    </div>
  );
};

export default AdminCampagnes;