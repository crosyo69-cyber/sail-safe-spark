import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bot, Loader2, Plus } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminAutomations } from "@/hooks/admin/useAdminAutomations";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationsList } from "@/components/admin/automations/AutomationsList";
import { AutomationRunsTable } from "@/components/admin/automations/AutomationRunsTable";
import { UpcomingRuns } from "@/components/admin/automations/UpcomingRuns";
import { AutomationFormDialog } from "@/components/admin/automations/AutomationFormDialog";
import { Automation, EMPTY_AUTOMATION } from "@/features/admin-automations/types";

const AdminAutomations = () => {
  const { isAdmin, isLoading } = useAdmin();
  const {
    automations, runs, segments, upcoming, runsByAutomation,
    loading, saving, running, testResult,
    save, toggleActive, remove, execute,
  } = useAdminAutomations(isAdmin);

  const [editing, setEditing] = useState<Partial<Automation> | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Automatisations marketing | Kitesurf Passion Hyères</title>
        <meta name="description" content="Pilotage des scénarios marketing automatisés de Kitesurf Passion à Hyères : déclencheurs, segments, tests et historique." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" /> Automatisations
            </h1>
            <p className="text-muted-foreground text-sm">
              Scénarios déclenchés par événement métier. Toujours testables avant envoi réel.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="min-h-[44px]">
              <Link to="/admin/campagnes"><ArrowLeft className="h-4 w-4 mr-2" /> Campagnes</Link>
            </Button>
            <Button className="min-h-[44px]" onClick={() => setEditing({ ...EMPTY_AUTOMATION })}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle automatisation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Automatisations</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="upcoming">Prochaines exécutions</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-4">
            <AutomationsList
              automations={automations}
              loading={loading}
              running={running}
              runsByAutomation={runsByAutomation}
              testResult={testResult}
              onToggle={(a, active) => void toggleActive(a, active)}
              onTest={(a) => void execute(a, "test")}
              onExecute={(a) => void execute(a, "live")}
              onEdit={setEditing}
              onDelete={(a) => void remove(a)}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <AutomationRunsTable runs={runs} automations={automations} />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <UpcomingRuns upcoming={upcoming} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      <AutomationFormDialog
        editing={editing}
        onEditingChange={setEditing}
        segments={segments}
        saving={saving}
        onSave={async () => {
          const done = await save(editing);
          if (done) setEditing(null);
        }}
      />
    </div>
  );
};

export default AdminAutomations;
