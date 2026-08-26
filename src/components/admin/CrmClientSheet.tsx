import { useCallback, useEffect, useState } from "react";
import { crmService } from "@/services/crm.service";
import { settle } from "@/services/_shared/result";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ACTIVITY_LABEL, LEVEL_LABEL, LIFECYCLE_LABEL, eur, type CrmDetail,
} from "./crm-types";

const fmt = (d?: string | null, pattern = "dd/MM/yyyy") => {
  if (!d) return "—";
  try { return format(parseISO(d), pattern, { locale: fr }); } catch { return "—"; }
};

type Props = { email: string | null; onClose: () => void; onSaved?: () => void };

export const CrmClientSheet = ({ email, onClose, onSaved }: Props) => {
  const [detail, setDetail] = useState<CrmDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [observations, setObservations] = useState("");
  const [gear, setGear] = useState("");
  const [consent, setConsent] = useState(false);
  const [tags, setTags] = useState("");
  const [levelActivity, setLevelActivity] = useState("kitesurf");
  const [levelValue, setLevelValue] = useState("debutant");
  const [levelNotes, setLevelNotes] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState("licence");

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    const { data, error } = settle(await crmService.clientDetail(email));
    setLoading(false);
    if (error) { toast.error("Chargement impossible : " + error.message); return; }
    const d = data as unknown as CrmDetail;
    setDetail(d);
    setPhone(d?.profile?.phone ?? d?.summary?.phone ?? "");
    setObservations(d?.profile?.observations ?? "");
    setGear(d?.profile?.recommended_gear ?? "");
    setConsent(!!d?.profile?.marketing_consent);
    setTags((d?.profile?.tags ?? []).join(", "));
  }, [email]);

  useEffect(() => { if (email) load(); else setDetail(null); }, [email, load]);

  const saveProfile = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = settle(await crmService.upsertProfile({
      p_email: email,
      p_first_name: detail?.summary?.first_name ?? null,
      p_last_name: detail?.summary?.last_name ?? null,
      p_phone: phone || null,
      p_observations: observations,
      p_recommended_gear: gear,
      p_marketing_consent: consent,
      p_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    }));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Fiche enregistrée");
    onSaved?.();
    load();
  };

  const saveLevel = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = settle(await crmService.setLevel({
      p_email: email,
      p_activity: levelActivity as never,
      p_level: levelValue as never,
      p_notes: levelNotes || null,
    }));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLevelNotes("");
    toast.success("Niveau mis à jour");
    load();
  };

  const addDoc = async () => {
    if (!email || !docTitle || !docUrl) { toast.error("Titre et lien requis"); return; }
    setBusy(true);
    const { error } = settle(await crmService.addDocument({
      p_email: email, p_title: docTitle, p_url: docUrl, p_doc_type: docType,
    }));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDocTitle(""); setDocUrl("");
    toast.success("Document ajouté");
    load();
  };

  const removeDoc = async (id: string) => {
    setBusy(true);
    const { error } = settle(await crmService.deleteDocument({ p_id: id }));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const s = detail?.summary;
  const lc = s ? LIFECYCLE_LABEL[s.lifecycle] : null;

  return (
    <Sheet open={!!email} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="break-words">
            {s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email : email}
          </SheetTitle>
          <SheetDescription className="break-all">{email}</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && detail && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {lc && <Badge className={lc.className} variant="secondary">{lc.label}</Badge>}
              {(s?.activities ?? []).map((a) => (
                <Badge key={a} variant="outline">{ACTIVITY_LABEL[a] ?? a}</Badge>
              ))}
              {s?.marketing_consent && <Badge variant="secondary">Opt-in marketing</Badge>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Séances", value: s?.reservations_count ?? 0 },
                { label: "CA total", value: eur(s?.revenue) },
                { label: "Crédits dispo", value: s?.credits_remaining ?? 0 },
                { label: "Dernière venue", value: fmt(s?.last_activity) },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-lg font-semibold text-foreground">{k.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="fiche">
              <TabsList className="flex flex-wrap h-auto w-full">
                <TabsTrigger value="fiche">Fiche</TabsTrigger>
                <TabsTrigger value="reservations">Réservations</TabsTrigger>
                <TabsTrigger value="credits">Crédits</TabsTrigger>
                <TabsTrigger value="paiements">Paiements</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="fiche" className="space-y-4 pt-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-phone">Téléphone</Label>
                    <Input id="crm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-tags">Étiquettes (séparées par des virgules)</Label>
                    <Input id="crm-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="VIP, groupe, entreprise" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-obs">Observations pédagogiques</Label>
                  <Textarea id="crm-obs" rows={4} value={observations} onChange={(e) => setObservations(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-gear">Matériel recommandé</Label>
                  <Textarea id="crm-gear" rows={3} value={gear} onChange={(e) => setGear(e.target.value)} placeholder="Aile 9m, board 138, harnais siège…" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Consentement marketing</p>
                    <p className="text-xs text-muted-foreground">
                      {detail.profile?.marketing_consent_at
                        ? `Depuis le ${fmt(detail.profile.marketing_consent_at)}`
                        : "Non renseigné"}
                    </p>
                  </div>
                  <Switch checked={consent} onCheckedChange={setConsent} aria-label="Consentement marketing" />
                </div>
                <Button onClick={saveProfile} disabled={busy} className="min-h-11">
                  {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Enregistrer la fiche
                </Button>

                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-semibold text-foreground">Niveau par activité</p>
                  {detail.levels.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun niveau renseigné.</p>
                  )}
                  <div className="space-y-2">
                    {detail.levels.map((l) => (
                      <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2">
                        <Badge variant="outline">{ACTIVITY_LABEL[l.activity] ?? l.activity}</Badge>
                        <span className="text-sm font-medium">{LEVEL_LABEL[l.level] ?? l.level}</span>
                        {l.notes && <span className="text-xs text-muted-foreground">— {l.notes}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <Select value={levelActivity} onValueChange={setLevelActivity}>
                      <SelectTrigger aria-label="Activité"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={levelValue} onValueChange={setLevelValue}>
                      <SelectTrigger aria-label="Niveau"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEVEL_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={levelNotes} onChange={(e) => setLevelNotes(e.target.value)} placeholder="Commentaire" />
                  </div>
                  <Button variant="outline" onClick={saveLevel} disabled={busy} className="min-h-11">
                    <Plus className="w-4 h-4 mr-2" />Enregistrer le niveau
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="reservations" className="pt-4">
                {detail.bookings.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune réservation.</p>
                )}
                <div className="space-y-2">
                  {detail.bookings.map((b) => (
                    <div key={`${b.kind}-${b.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {fmt(b.date)} · {ACTIVITY_LABEL[b.activity ?? ""] ?? b.activity ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.kind === "package" ? "Pack (crédit)" : `Visiteur · ${b.participants} p.`}
                          {b.skill_level ? ` · ${LEVEL_LABEL[b.skill_level] ?? b.skill_level}` : ""}
                        </p>
                      </div>
                      <Badge variant={b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="credits" className="pt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Portefeuille FIFO</p>
                  {detail.credits.length === 0 && <p className="text-sm text-muted-foreground">Aucun crédit.</p>}
                  <div className="space-y-2">
                    {detail.credits.map((c) => (
                      <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {ACTIVITY_LABEL[c.activity] ?? c.activity} · {c.package_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Origine {c.origin} · expire le {fmt(c.expires_at)}
                          </p>
                        </div>
                        <Badge variant={c.status === "available" ? "secondary" : "outline"}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Historique</p>
                  <div className="space-y-1">
                    {detail.credit_history.map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/60 py-1.5">
                        <span className="text-muted-foreground">{fmt(h.created_at)} · {h.kind}</span>
                        <span className={h.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                          {h.delta > 0 ? `+${h.delta}` : h.delta} → {h.balance_after}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paiements" className="pt-4">
                {detail.payments.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement Stripe.</p>}
                <div className="space-y-2">
                  {detail.payments.map((p, i) => (
                    <div key={`${p.stripe_session_id}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {eur(p.amount)} · {p.source === "package" ? "Pack" : "Acompte réservation"}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          {fmt(p.paid_at)} · {p.reference ?? p.stripe_session_id}
                        </p>
                      </div>
                      <Badge variant="outline">{ACTIVITY_LABEL[p.activity ?? ""] ?? p.activity ?? "—"}</Badge>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Packs</p>
                  {detail.packages.map((pk) => (
                    <div key={pk.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{pk.code} · {ACTIVITY_LABEL[pk.activity] ?? pk.activity}</p>
                        <p className="text-xs text-muted-foreground">
                          {pk.used_sessions}/{pk.total_sessions} séances · expire le {fmt(pk.expires_at)}
                        </p>
                      </div>
                      <Badge variant="secondary">{pk.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="pt-4 space-y-3">
                {detail.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.doc_type} · {fmt(d.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${d.title}`}>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11"
                        onClick={() => removeDoc(d.id)} aria-label={`Supprimer ${d.title}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="grid sm:grid-cols-3 gap-2">
                  <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Titre" aria-label="Titre du document" />
                  <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://…" aria-label="Lien du document" />
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger aria-label="Type de document"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licence">Licence FFVL</SelectItem>
                      <SelectItem value="attestation">Attestation</SelectItem>
                      <SelectItem value="facture">Facture</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={addDoc} disabled={busy} className="min-h-11">
                  <Plus className="w-4 h-4 mr-2" />Ajouter le document
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};