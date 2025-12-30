import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Adresse email invalide" }).max(255);

interface NewsletterFormProps {
  variant?: "default" | "compact" | "footer";
  className?: string;
}

export const NewsletterForm = forwardRef<HTMLDivElement, NewsletterFormProps>(
  function NewsletterForm({ variant = "default", className = "" }, ref) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    // Simulate API call (replace with actual backend when Cloud is enabled)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setIsSubscribed(true);
    setEmail("");

    toast({
      title: "Inscription réussie !",
      description: "Vous recevrez bientôt nos actualités et conseils kitesurf.",
    });
  };

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-3 text-primary ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Merci pour votre inscription !</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/10 border-border/30 text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button type="submit" variant="sunset" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </form>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <Input
          type="email"
          placeholder="Entrez votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" variant="sunset" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          S'inscrire
        </Button>
        {error && <p className="text-destructive text-sm absolute">{error}</p>}
      </form>
    );
  }

  // Default variant
  return (
    <div className={`bg-gradient-to-br from-primary/5 via-turquoise/5 to-primary/5 rounded-3xl p-8 ${className}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Newsletter Kitesurf
        </h3>
        <p className="text-muted-foreground mb-6">
          Recevez nos conseils d'experts, prévisions météo et offres exclusives directement dans votre boîte mail.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12"
              disabled={isLoading}
            />
            <Button type="submit" variant="sunset" size="lg" disabled={isLoading} className="h-12">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  S'inscrire
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>
        
        <p className="text-xs text-muted-foreground mt-4">
          Pas de spam, seulement du contenu de qualité. Désabonnement en 1 clic.
        </p>
      </div>
    </div>
  );
});

NewsletterForm.displayName = "NewsletterForm";
