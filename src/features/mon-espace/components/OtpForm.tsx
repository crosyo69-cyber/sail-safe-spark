import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailCheck } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
  verifying: boolean;
  resending: boolean;
}

export const OtpForm = ({
  value,
  onChange,
  onSubmit,
  onResend,
  onBack,
  verifying,
  resending,
}: Props) => (
  <Card className="max-w-md">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MailCheck className="w-5 h-5 text-primary" /> Vérification de sécurité
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        Si votre code client est valide, un code de sécurité à 6 chiffres vient d'être envoyé à
        l'adresse e-mail associée à votre dossier. Il est valable 10 minutes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          aria-label="Code de sécurité à 6 chiffres"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="font-mono tracking-[0.4em] text-center"
          maxLength={6}
        />
        <Button
          type="submit"
          disabled={verifying || value.length !== 6}
          className="min-h-[44px]"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px]"
          onClick={onResend}
          disabled={resending}
        >
          {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renvoyer le code"}
        </Button>
        <Button type="button" variant="ghost" className="min-h-[44px]" onClick={onBack}>
          Changer de code client
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Vous n'avez rien reçu ? Patientez une minute avant de demander un nouvel envoi, puis
        vérifiez vos spams.
      </p>
    </CardContent>
  </Card>
);
