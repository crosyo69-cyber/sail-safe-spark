import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  loading: boolean;
}

export const CodeForm = ({ value, onChange, onSubmit, loading }: Props) => (
  <Card className="max-w-md">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Ticket className="w-5 h-5 text-primary" /> Votre code
      </CardTitle>
    </CardHeader>
    <CardContent>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
        className="flex gap-2"
      >
        <Input
          placeholder="KP-2026-XXXX"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="font-mono uppercase tracking-widest"
          maxLength={20}
        />
        <Button type="submit" disabled={loading || !value.trim()} className="min-h-[44px]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accéder"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">
        Vous avez reçu ce code par email après le paiement de votre acompte.
      </p>
    </CardContent>
  </Card>
);