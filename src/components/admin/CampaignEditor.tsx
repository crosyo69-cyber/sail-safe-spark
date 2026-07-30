import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2, Monitor, Smartphone, Users, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ACTIVITY_OPTIONS, Campaign, CampaignAudience, CampaignStatus, EMPTY_AUDIENCE, STATUS_META,
} from "./campaign-types";

type Props = {
  open: boolean;
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const buildEmailHtml = (c: {
  subject: string; preheader?: string | null; content_html: string;
  hero_image_url?: string | null; cta_label?: string | null; cta_url?: string | null;
}) => `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(c.subject || "Campagne")}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Arial,sans-serif;color:#0F172A;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0F172A;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:700;">KiteSurf Passion</td></tr>
${c.hero_image_url ? `<tr><td><img src="${escapeHtml(c.hero_image_url)}" alt="" style="display:block;width:100%;height:auto;"></td></tr>` : ""}
<tr><td style="padding:24px;font-size:16px;line-height:1.6;">${c.content_html || "<p style=\"color:#94a3b8\">(Contenu vide)</p>"}</td></tr>
${c.cta_label && c.cta_url ? `<tr><td align="center" style="padding:0 24px 28px;"><a href="${escapeHtml(c.cta_url)}" style="display:inline-block;background:#F97316;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;">${escapeHtml(c.cta_label)}</a></td></tr>` : ""}
<tr><td style="background:#f8fafc;padding:18px 24px;font-size:12px;color:#64748b;">KiteSurf Passion — Hyères · Carqueiranne<br>06 72 71 69 05 — crosyo69@gmail.com</td></tr>
</table></td></tr></table></body></html>`;

const CampaignEditor = ({ open, campaign, onOpenChange, onSaved }: Props) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [audience, setAudience] = useState<CampaignAudience>(EMPTY_AUDIENCE);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!open) return;
    setName(campaign?.name ?? "");
    setSubject(campaign?.subject ?? "");
    setPreheader(campaign?.preheader ?? "");
    setContentHtml(campaign?.content_html ?? "<p>Bonjour,</p>\n<p>…</p>");
    setHeroImageUrl(campaign?.hero_image_url ?? "");
    setCtaLabel(campaign?.cta_label ?? "");
    setCtaUrl(campaign?.cta_url ?? "");
    setStatus(campaign?.status ?? "draft");
    setScheduledAt(campaign?.scheduled_at ? campaign.scheduled_at.slice(0, 16) : "");
    setAudience({ ...EMPTY_AUDIENCE, ...(campaign?.audience ?? {}) });
    setRecipients(campaign?.recipients_count ?? null);
  }, [open, campaign]);

  const estimate = useCallback(async (aud: CampaignAudience) => {
    setEstimating(true);
    const { data, error } = await supabase.rpc("marketing_estimate_audience", {
      p_audience: aud as unknown as never,
    });
    setEstimating(false);
    if (error) {
      toast.error("Estimation impossible", { description: error.message });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setRecipients(Number((row as { recipients?: number } | null)?.recipients ?? 0));
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { void estimate(audience); }, 350);
    return () => clearTimeout(t);
  }, [open, audience, estimate]);

  const previewHtml = useMemo(
    () => buildEmailHtml({ subject, preheader, content_html: contentHtml, hero_image_url: heroImageUrl, cta_label: ctaLabel, cta_url: ctaUrl }),
    [subject, preheader, contentHtml, heroImageUrl, ctaLabel, ctaUrl],
  );

  const toggleActivity = (value: string, checked: boolean) =>
    setAudience((a) => ({
      ...a,
      activities: checked ? [...a.activities, value] : a.activities.filter((v) => v !== value),
    }));

  const toggleLifecycle = (value: string, checked: boolean) =>
    setAudience((a) => ({
      ...a,
      lifecycle: checked ? [...a.lifecycle, value] : a.lifecycle.filter((v) => v !== value),
    }));

  const save = async () => {
    if (!name.trim()) { toast.error("Le nom de la campagne est requis"); return; }
    if (status === "scheduled" && !scheduledAt) { toast.error("Choisissez une date de planification"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      preheader: preheader.trim() || null,
      content_html: contentHtml,
      hero_image_url: heroImageUrl.trim() || null,
      cta_label: ctaLabel.trim() || null,
      cta_url: ctaUrl.trim() || null,
      status,
      scheduled_at: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      audience: audience as unknown as never,
      recipients_count: recipients ?? 0,
      updated_by: userData.user?.id ?? null,
      updated_by_email: userData.user?.email ?? null,
    };
    const { error } = campaign
      ? await supabase.from("marketing_campaigns").update(payload).eq("id", campaign.id)
      : await supabase.from("marketing_campaigns").insert({
          ...payload,
          created_by: userData.user?.id ?? null,
          created_by_email: userData.user?.email ?? null,
        });
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible", { description: error.message }); return; }
    toast.success(campaign ? "Campagne mise à jour" : "Campagne créée");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{campaign ? "Modifier la campagne" : "Nouvelle campagne"}</SheetTitle>
          <SheetDescription>
            Aucun email n'est envoyé à cette étape : création, sauvegarde et aperçu uniquement.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="contenu" className="mt-6 space-y-4">
          <TabsList>
            <TabsTrigger value="contenu">Contenu</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            {campaign && <TabsTrigger value="historique">Historique</TabsTrigger>}
          </TabsList>

          <TabsContent value="contenu" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nom de la campagne *</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Relance crédits automne" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-subject">Objet</Label>
              <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Vos séances vous attendent à Hyères" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-preheader">Pré-en-tête</Label>
              <Input id="c-preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Texte affiché après l'objet dans la boîte de réception" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-content">Contenu (HTML)</Label>
              <Textarea id="c-content" rows={12} value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">Balises simples : &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;a&gt;…</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-hero">Image principale (URL, facultatif)</Label>
              <Input id="c-hero" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-cta-label">Bouton — texte</Label>
                <Input id="c-cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Réserver ma séance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-cta-url">Bouton — URL</Label>
                <Input id="c-cta-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://www.kitesurfpassion.fr/reserver" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as CampaignStatus[]).map((s) => (
                      <SelectItem key={s} value={s} disabled={s === "sent"}>
                        {STATUS_META[s].label}{s === "sent" ? " (à venir)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {status === "scheduled" && (
                <div className="space-y-2">
                  <Label htmlFor="c-sched">Date planifiée</Label>
                  <Input id="c-sched" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-5">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Destinataires estimés</p>
                  <p className="text-2xl font-bold">
                    {estimating ? <Loader2 className="h-5 w-5 animate-spin" /> : (recipients ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium">Activités</p>
              <p className="text-xs text-muted-foreground">Aucune case cochée = tous les clients.</p>
              {ACTIVITY_OPTIONS.map((o) => (
                <label key={o.value} className="flex min-h-[44px] items-center gap-3 text-sm">
                  <Checkbox
                    checked={audience.activities.includes(o.value)}
                    onCheckedChange={(c) => toggleActivity(o.value, c === true)}
                  />
                  {o.label}
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Segments</p>
              {[
                { key: "active", label: "Clients actifs" },
                { key: "inactive", label: "Clients inactifs" },
              ].map((o) => (
                <label key={o.key} className="flex min-h-[44px] items-center gap-3 text-sm">
                  <Checkbox
                    checked={audience.lifecycle.includes(o.key)}
                    onCheckedChange={(c) => toggleLifecycle(o.key, c === true)}
                  />
                  {o.label}
                </label>
              ))}
              <label className="flex min-h-[44px] items-center gap-3 text-sm">
                <Checkbox checked={audience.with_credits} onCheckedChange={(c) => setAudience((a) => ({ ...a, with_credits: c === true }))} />
                Clients avec crédits
              </label>
              <label className="flex min-h-[44px] items-center gap-3 text-sm">
                <Checkbox checked={audience.expiring_30d} onCheckedChange={(c) => setAudience((a) => ({ ...a, expiring_30d: c === true }))} />
                Crédits expirant dans moins de 30 jours
              </label>
              <label className="flex min-h-[44px] items-center gap-3 text-sm">
                <Checkbox checked={audience.marketing_consent_only} onCheckedChange={(c) => setAudience((a) => ({ ...a, marketing_consent_only: c === true }))} />
                Consentement marketing = Oui uniquement
              </label>
            </div>
          </TabsContent>

          <TabsContent value="apercu" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button type="button" variant={device === "desktop" ? "default" : "outline"} size="sm" onClick={() => setDevice("desktop")}>
                <Monitor className="mr-2 h-4 w-4" />Desktop
              </Button>
              <Button type="button" variant={device === "mobile" ? "default" : "outline"} size="sm" onClick={() => setDevice("mobile")}>
                <Smartphone className="mr-2 h-4 w-4" />Mobile
              </Button>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-3 space-y-1 px-1">
                <p className="text-sm font-semibold">{subject || "(Objet vide)"}</p>
                <p className="text-xs text-muted-foreground">{preheader || "(Pré-en-tête vide)"}</p>
              </div>
              <div className="mx-auto bg-background" style={{ maxWidth: device === "mobile" ? 390 : "100%" }}>
                <iframe
                  title="Aperçu de la campagne"
                  sandbox=""
                  srcDoc={previewHtml}
                  className="w-full rounded-md border bg-white"
                  style={{ height: 640 }}
                />
              </div>
            </div>
          </TabsContent>

          {campaign && (
            <TabsContent value="historique" className="space-y-3 text-sm">
              <div className="flex justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Créée le</span>
                <span>{format(parseISO(campaign.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
              </div>
              <div className="flex justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Auteur</span>
                <span>{campaign.created_by_email ?? "—"}</span>
              </div>
              <div className="flex justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Dernière modification</span>
                <span>{format(parseISO(campaign.updated_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}{campaign.updated_by_email ? ` — ${campaign.updated_by_email}` : ""}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant="secondary" className={STATUS_META[campaign.status]?.className}>
                  {STATUS_META[campaign.status]?.label}
                </Badge>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-6 flex justify-end gap-2 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CampaignEditor;