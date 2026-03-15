import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AdminSessionManager from "@/components/admin/AdminSessionManager";
import AdminReservationList from "@/components/admin/AdminReservationList";
import AdminEmailDashboard from "@/components/admin/AdminEmailDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Mail, Loader2 } from "lucide-react";

const Admin = () => {
  const { isAdmin, isLoading, user } = useAdmin();

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
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          Administration
        </h1>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sessions" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="reservations" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Réservations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <AdminSessionManager />
          </TabsContent>

          <TabsContent value="reservations">
            <AdminReservationList />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
