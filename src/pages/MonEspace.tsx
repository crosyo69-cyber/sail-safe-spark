import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useMonEspace } from "@/hooks/client/useMonEspace";
import { StageBookingPanel } from "@/features/reservation/components/StageBookingPanel";
import {
  CodeForm,
  OtpForm,
  ExpiringCreditsNotice,
  PackageSummary,
  WalletGrid,
  ReminderPreferences,
  BookedDays,
  BookingSection,
  CreditHistoryList,
} from "@/features/mon-espace";


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
          Saisissez votre code de réservation, puis le code de sécurité envoyé par e-mail.
        </p>

        {ctrl.step === "code" && (
          <CodeForm
            value={ctrl.codeInput}
            onChange={ctrl.setCodeInput}
            onSubmit={ctrl.submitCode}
            loading={ctrl.sendingCode}
          />
        )}

        {ctrl.step === "otp" && (
          <OtpForm
            value={ctrl.otpInput}
            onChange={ctrl.setOtpInput}
            onSubmit={ctrl.submitOtp}
            onResend={ctrl.resendCode}
            onBack={ctrl.backToCode}
            verifying={ctrl.verifying}
            resending={ctrl.sendingCode}
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

            {pkg.activity === "stage_100_glisse" ? (
              <StageBookingPanel code={pkg.package_code} onBooked={() => ctrl.refresh()} />
            ) : (
            <BookingSection
              packageInactive={ctrl.packageInactive}
              packageExpired={ctrl.packageExpired}
              noCredits={ctrl.noCredits}
              canBook={ctrl.canBook}
              selectedDate={ctrl.selectedDate}
              onSelectDate={ctrl.setSelectedDate}
              bookedDates={ctrl.bookedDates}
              today={ctrl.today}
              activityLabel={ctrl.activityLabel}
              capacity={ctrl.capacity}
              busy={ctrl.busyAction}
              onBook={ctrl.handleBook}
            />
            )}

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
