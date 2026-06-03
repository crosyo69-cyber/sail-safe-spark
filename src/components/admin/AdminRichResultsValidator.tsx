import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { blogArticles } from "@/pages/Blog";
import { CheckCircle2, XCircle, ExternalLink, Loader2, FileSearch } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SchemaReport {
  url: string;
  scripts: number;
  types: string[];
  hasArticle: boolean;
  hasFAQPage: boolean;
  faqQuestions: string[];
  visibleQuestions: string[];
  questionsMatch: boolean;
  rawJsonLd: any[];
  error?: string;
}

const extractFromDoc = (doc: Document, url: string): SchemaReport => {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const parsed: any[] = [];
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.textContent || "");
      parsed.push(json);
    } catch {
      /* ignore */
    }
  }

  const flatten = (node: any): any[] => {
    if (!node) return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (node["@graph"]) return [node, ...flatten(node["@graph"])];
    return [node];
  };
  const all = parsed.flatMap(flatten);
  const types = Array.from(
    new Set(all.map((n) => (Array.isArray(n["@type"]) ? n["@type"].join("/") : n["@type"])).filter(Boolean))
  );

  const faqNode = all.find((n) => n["@type"] === "FAQPage");
  const faqQuestions: string[] =
    faqNode?.mainEntity?.map?.((q: any) => String(q.name || "").trim()).filter(Boolean) || [];

  // Visible FAQ headings rendered by the Accordion
  const visibleQuestions = Array.from(doc.querySelectorAll('[data-radix-collection-item], button[aria-expanded]'))
    .map((el) => el.textContent?.trim() || "")
    .filter((t) => t.endsWith("?"));

  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const questionsMatch =
    faqQuestions.length > 0 &&
    faqQuestions.every((q) => visibleQuestions.some((v) => norm(v).includes(norm(q).slice(0, 30))));

  return {
    url,
    scripts: scripts.length,
    types,
    hasArticle: all.some((n) => n["@type"] === "Article" || n["@type"] === "BlogPosting"),
    hasFAQPage: !!faqNode,
    faqQuestions,
    visibleQuestions,
    questionsMatch,
    rawJsonLd: parsed,
  };
};

const loadInIframe = (url: string): Promise<Document> =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.width = "1024px";
    iframe.style.height = "768px";
    iframe.src = url;
    let settled = false;
    const cleanup = () => iframe.remove();
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        const doc = iframe.contentDocument;
        if (doc) resolve(doc);
        else reject(new Error("Pas d'accès au document iframe"));
      } catch (e: any) {
        reject(e);
      } finally {
        // Defer cleanup so caller can read DOM
        setTimeout(cleanup, 100);
      }
    }, 3500);
    iframe.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error("Échec du chargement de la page"));
    };
    document.body.appendChild(iframe);
  });

const AdminRichResultsValidator = () => {
  const [slug, setSlug] = useState<string>(blogArticles[0]?.slug || "");
  const [customPath, setCustomPath] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SchemaReport | null>(null);

  const targetPath = customPath.trim() || `/blog/${slug}`;
  const targetUrl = `${window.location.origin}${targetPath}`;

  const runValidation = async () => {
    setLoading(true);
    setReport(null);
    try {
      const doc = await loadInIframe(targetPath);
      const r = extractFromDoc(doc, targetUrl);
      setReport(r);
      if (r.hasFAQPage) {
        toast({ title: "FAQPage détecté ✓", description: `${r.faqQuestions.length} questions dans le schema.` });
      } else {
        toast({ title: "FAQPage absent", description: "Aucun schema FAQPage trouvé.", variant: "destructive" });
      }
    } catch (e: any) {
      setReport({
        url: targetUrl,
        scripts: 0,
        types: [],
        hasArticle: false,
        hasFAQPage: false,
        faqQuestions: [],
        visibleQuestions: [],
        questionsMatch: false,
        rawJsonLd: [],
        error: e.message || "Erreur inconnue",
      });
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rich-results-${slug || "page"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const richResultsTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(targetUrl)}`;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSearch className="w-5 h-5" /> Validation Rich Results
          </h2>
          <p className="text-sm text-muted-foreground">
            Charge la page dans une iframe et inspecte les blocs JSON-LD (Article + FAQPage), puis compare les
            questions du schema aux questions visibles dans l'accordéon.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Article de blog</label>
            <Select value={slug} onValueChange={(v) => { setSlug(v); setCustomPath(""); }}>
              <SelectTrigger><SelectValue placeholder="Choisir un article" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {blogArticles.map((a: any) => (
                  <SelectItem key={a.slug} value={a.slug}>{a.slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ou chemin personnalisé</label>
            <Input
              placeholder="/blog/mon-article"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={runValidation} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
            Valider Rich Results
          </Button>
          <a href={richResultsTestUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" /> Tester sur Google
            </Button>
          </a>
          {report && (
            <Button variant="outline" onClick={downloadReport}>Télécharger le rapport JSON</Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground break-all">URL cible : {targetUrl}</p>
      </Card>

      {report && (
        <Card className="p-4 space-y-4">
          {report.error ? (
            <p className="text-destructive text-sm">Erreur : {report.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{report.scripts} bloc(s) JSON-LD</Badge>
                <Badge variant={report.hasArticle ? "default" : "destructive"} className="gap-1">
                  {report.hasArticle ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Article
                </Badge>
                <Badge variant={report.hasFAQPage ? "default" : "destructive"} className="gap-1">
                  {report.hasFAQPage ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  FAQPage
                </Badge>
                {report.hasFAQPage && (
                  <Badge variant={report.questionsMatch ? "default" : "destructive"} className="gap-1">
                    {report.questionsMatch ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    Schema ↔ Visible
                  </Badge>
                )}
              </div>

              <div className="text-sm">
                <p className="font-medium mb-1">Types détectés</p>
                <p className="text-muted-foreground">{report.types.join(", ") || "(aucun)"}</p>
              </div>

              {report.faqQuestions.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Questions dans le schema FAQPage ({report.faqQuestions.length})</p>
                  <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                    {report.faqQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ol>
                </div>
              )}

              {report.visibleQuestions.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Questions visibles dans la page ({report.visibleQuestions.length})</p>
                  <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                    {report.visibleQuestions.slice(0, 20).map((q, i) => <li key={i}>{q}</li>)}
                  </ol>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Voir le JSON-LD brut</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-96">
                  {JSON.stringify(report.rawJsonLd, null, 2)}
                </pre>
              </details>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminRichResultsValidator;