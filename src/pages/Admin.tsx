import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminReservationList from "@/components/admin/AdminReservationList";
import AdminEmailDashboard from "@/components/admin/AdminEmailDashboard";
import AdminEmailQueueMonitor from "@/components/admin/AdminEmailQueueMonitor";
import AdminRevenueDashboard from "@/components/admin/AdminRevenueDashboard";
import AdminSeasonStats from "@/components/admin/AdminSeasonStats";
import Admin404Monitor from "@/components/admin/Admin404Monitor";
import AdminConversionDedupMonitor from "@/components/admin/AdminConversionDedupMonitor";
import AdminPackagesManager from "@/components/admin/AdminPackagesManager";
import AdminCreditStats from "@/components/admin/AdminCreditStats";
import AdminStudentsManager from "@/components/admin/AdminStudentsManager";
import AdminConversionFunnel from "@/components/admin/AdminConversionFunnel";
import AdminRichResultsValidator from "@/components/admin/AdminRichResultsValidator";
import AdminAlertsCenter from "@/components/admin/AdminAlertsCenter";
import AdminNotificationsBell from "@/components/admin/AdminNotificationsBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, CalendarDays, ClipboardList, Mail, Loader2, Euro, BarChart3, AlertTriangle, ShieldAlert, Ticket, Inbox, TrendingUp, FileSearch, Users, Bell, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Administration | Kitesurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Administration
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/journees"><CalendarDays className="w-4 h-4 mr-2" />Gestion des journées</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/credits"><Wallet className="w-4 h-4 mr-2" />Gestion des crédits</Link>
            </Button>
            <AdminNotificationsBell onOpenCenter={() => setActiveTab("alertes")} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full max-w-6xl h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="reservations" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Réservations</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Packs</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Crédits</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Élèves</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <Euro className="w-4 h-4" />
              <span className="hidden sm:inline">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Conversion</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">File email</span>
            </TabsTrigger>
            <TabsTrigger value="404" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">404</span>
            </TabsTrigger>
            <TabsTrigger value="dedup" className="gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Dédup</span>
            </TabsTrigger>
            <TabsTrigger value="richresults" className="gap-2">
              <FileSearch className="w-4 h-4" />
              <span className="hidden sm:inline">Rich Results</span>
            </TabsTrigger>
            <TabsTrigger value="alertes" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alertes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="reservations">
            <AdminReservationList />
          </TabsContent>

          <TabsContent value="packages">
            <AdminPackagesManager />
          </TabsContent>

          <TabsContent value="credits">
            <AdminCreditStats />
          </TabsContent>

          <TabsContent value="students">
            <AdminStudentsManager />
          </TabsContent>

          <TabsContent value="revenue">
            <AdminRevenueDashboard />
          </TabsContent>

          <TabsContent value="stats">
            <AdminSeasonStats />
          </TabsContent>

          <TabsContent value="conversion">
            <AdminConversionFunnel />
          </TabsContent>

          <TabsContent value="emails">
            <AdminEmailDashboard />
          </TabsContent>

          <TabsContent value="queue">
            <AdminEmailQueueMonitor />
          </TabsContent>

          <TabsContent value="404">
            <Admin404Monitor />
          </TabsContent>

          <TabsContent value="dedup">
            <AdminConversionDedupMonitor />
          </TabsContent>

          <TabsContent value="richresults">
            <AdminRichResultsValidator />
          </TabsContent>

          <TabsContent value="alertes">
            <AdminAlertsCenter />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
