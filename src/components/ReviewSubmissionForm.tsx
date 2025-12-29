import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(50, "Le nom ne peut pas dépasser 50 caractères"),
  email: z.string().trim().email("Adresse email invalide").max(100, "L'email ne peut pas dépasser 100 caractères"),
  course: z.string().min(1, "Veuillez sélectionner une activité"),
  rating: z.number().min(1, "Veuillez donner une note").max(5),
  comment: z.string().trim().min(10, "Votre avis doit contenir au moins 10 caractères").max(500, "Votre avis ne peut pas dépasser 500 caractères"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const activities = [
  "Stage Wingfoil",
  "Cours Kitesurf",
  "Cours Pumpfoil",
  "Stage 100% Glisse",
  "Location Matériel",
  "Foil Tracté / Wakeboard",
  "Déposes en Mer",
];

export function ReviewSubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState<ReviewFormData>({
    name: "",
    email: "",
    course: "",
    rating: 0,
    comment: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({});

  const handleInputChange = (field: keyof ReviewFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = reviewSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ReviewFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ReviewFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({
      title: "Merci pour votre avis ! ⭐",
      description: "Votre témoignage sera publié après modération.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground mb-2">
          Merci pour votre avis !
        </h3>
        <p className="text-muted-foreground">
          Votre témoignage sera vérifié et publié prochainement.
        </p>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: "", email: "", course: "", rating: 0, comment: "" });
          }}
        >
          Laisser un autre avis
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8">
      <h3 className="text-xl font-heading font-bold text-foreground mb-6 text-center">
        Partagez votre expérience
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="review-name">Votre prénom *</Label>
            <Input
              id="review-name"
              placeholder="Jean"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-email">Votre email *</Label>
            <Input
              id="review-email"
              type="email"
              placeholder="jean@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-course">Activité pratiquée *</Label>
          <select
            id="review-course"
            value={formData.course}
            onChange={(e) => handleInputChange("course", e.target.value)}
            className={`w-full h-10 px-3 rounded-md border bg-background text-foreground ${
              errors.course ? "border-destructive" : "border-input"
            }`}
          >
            <option value="">Sélectionnez une activité</option>
            {activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
          {errors.course && <p className="text-sm text-destructive">{errors.course}</p>}
        </div>

        <div className="space-y-2">
          <Label>Votre note *</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleInputChange("rating", star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || formData.rating)
                      ? "text-sunset fill-sunset"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            {formData.rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.rating}/5
              </span>
            )}
          </div>
          {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">Votre avis *</Label>
          <Textarea
            id="review-comment"
            placeholder="Racontez-nous votre expérience..."
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            className={`min-h-[120px] resize-none ${errors.comment ? "border-destructive" : ""}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {errors.comment ? (
              <p className="text-destructive">{errors.comment}</p>
            ) : (
              <span>Minimum 10 caractères</span>
            )}
            <span>{formData.comment.length}/500</span>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Envoyer mon avis
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Votre avis sera modéré avant publication. Votre email ne sera jamais partagé.
        </p>
      </form>
    </div>
  );
}
