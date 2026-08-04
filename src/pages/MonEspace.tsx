import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useMonEspace } from "@/hooks/client/useMonEspace";
import { CodeForm } from "@/components/mon-espace/CodeForm";
import { ExpiringCreditsNotice } from "@/components/mon-espace/ExpiringCreditsNotice";
import { PackageSummary } from "@/components/mon-espace/PackageSummary";
import { WalletGrid } from "@/components/mon-espace/WalletGrid";
import { ReminderPreferences } from "@/components/mon-espace/ReminderPreferences";
import { BookedDays } from "@/components/mon-espace/BookedDays";
import { BookingSection } from "@/components/mon-espace/BookingSection";
import { CreditHistoryList } from "@/components/mon-espace/CreditHistoryList";

const MonEspace = () => {
  const ctrl = useMonEspace();
  const { pkg } = ctrl;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mon espace réservation – Kitesurf Passion Hyères</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Espace de gestion de vos réservations Kitesurf Passion à Hyères. Réservez vos journées de cours selon les conditions météo." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Mon espace réservation
        </h1>
        <p className="text-muted-foreground mb-8">
          Saisissez votre code de réservation pour gérer vos journées.
        </p>

        {!pkg && (
          <CodeForm
            value={ctrl.codeInput}
            onChange={ctrl.setCodeInput}
            onSubmit={ctrl.submitCode}
            loading={ctrl.loading}
          />
        )}

        {pkg && (
          <div className="space-y-8">
            <ExpiringCreditsNotice credits={ctrl.credits} />

            <PackageSummary pkg={pkg} activityLabel={ctrl.activityLabel} />

            <WalletGrid wallet={ctrl.wallet} credits={ctrl.credits} />

            <ReminderPreferences
              reminders={ctrl.reminders}
              saving={ctrl.savingReminders}
              onChange={ctrl.updateReminders}
              marketingCode={pkg.package_code || ctrl.codeInput}
            />

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Comment ça marche ?</p>
                <p className="text-muted-foreground">
                  Choisissez simplement une date. <strong>L'horaire est déterminé la veille</strong> selon
                  les conditions météo (vent, mer, sécurité). Vous serez contacté(e) par KiteSurf Passion
                  pour connaître votre heure de rendez-vous.
                </p>
              </div>
            </div>

            <BookedDays
              bookings={ctrl.bookings}
              busy={ctrl.busyAction}
              onCancel={ctrl.handleCancel}
            />

            <BookingSection
              packageInactive={ctrl.packageInactive}
              packageExpired={ctrl.packageExpired}
              noCredits={ctrl.noCredits}
              canBook={ctrl.canBook}
              selectedDate={ctrl.selectedDate}
              onSelectDate={ctrl.setSelectedDate}
              bookedDates={ctrl.bookedDates}
              tomorrow={ctrl.tomorrow}
              activityLabel={ctrl.activityLabel}
              capacity={ctrl.capacity}
              busy={ctrl.busyAction}
              onBook={ctrl.handleBook}
            />

            <CreditHistoryList history={ctrl.history} />

            <div className="pt-4">
              <Button variant="ghost" onClick={ctrl.exit}>
                Quitter cet espace
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MonEspace;
