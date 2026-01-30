import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Wind, Mail, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Email validation schema
const emailSchema = z.string().trim().email({ message: "Adresse email invalide" }).max(255);

export const WeatherAlertSubscription = () => {
  const [email, setEmail] = useState("");
  const [windRange, setWindRange] = useState([10, 30]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Honeypot field - should remain empty
  const [honeypot, setHoneypot] = useState("");
  
  // Track form load time to detect bots
  const formLoadTime = useRef<number>(Date.now());
  
  // Reset form load time on mount
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection: honeypot field should be empty
    if (honeypot) {
      // Silently reject - don't reveal bot detection
      setIsSubscribed(true);
      return;
    }
    
    // Bot detection: form submitted too quickly (less than 2 seconds)
    const timeElapsed = Date.now() - formLoadTime.current;
    if (timeElapsed < 2000) {
      // Silently reject - don't reveal timing detection
      setIsSubscribed(true);
      return;
    }
    
    // Validate email with zod
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      toast.error(emailValidation.error.errors[0]?.message || "Adresse email invalide");
      return;
    }
    
    const validatedEmail = emailValidation.data;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("weather_alert_subscriptions")
        .upsert({
          email: validatedEmail,
          min_wind: windRange[0],
          max_wind: windRange[1],
          enabled: true,
        }, {
          onConflict: "email"
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Vous êtes maintenant abonné aux alertes météo !");
    } catch (error: unknown) {
      console.error("Subscription error");
      toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Abonnement confirmé !</h3>
              <p className="text-muted-foreground mt-2">
                Vous recevrez un email quand le vent sera entre {windRange[0]} et {windRange[1]} nœuds.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsSubscribed(false)}
              className="mt-4"
            >
              Modifier mes préférences
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Bell className="h-5 w-5 text-primary" />
          Alertes Météo Kitesurf
        </CardTitle>
        <CardDescription>
          Recevez un email quand les conditions sont idéales pour naviguer à l'Almanarre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubscribe} className="space-y-6">
          {/* Honeypot field - hidden from users, visible to bots */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weather-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Adresse email
            </Label>
            <Input
              id="weather-email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="bg-background"
            />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              Plage de vent souhaitée
            </Label>
            <div className="px-2">
              <Slider
                value={windRange}
                onValueChange={setWindRange}
                min={5}
                max={40}
                step={1}
                className="my-4"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-medium text-primary">{windRange[0]} nœuds</span>
              <span className="text-muted-foreground">à</span>
              <span className="font-medium text-primary">{windRange[1]} nœuds</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Vous serez alerté quand le vent sera dans cette plage
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Inscription..." : "S'abonner aux alertes"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pour vous désabonner, utilisez le lien dans l'email d'alerte.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
