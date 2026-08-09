import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BlogArticleCta = ({ slug }: { slug: string | undefined }) => (
  <div className="max-w-3xl mx-auto mt-12 bg-gradient-to-br from-primary/10 to-turquoise/10 rounded-3xl p-8 text-center">
    <h3 className="font-display text-2xl font-bold text-foreground mb-4">
      {slug === "logement-stage-kitesurf-hyeres"
        ? "Le logement est calé ? Réservez votre stage"
        : "Prêt à Passer à l'Action ?"}
    </h3>
    <p className="text-muted-foreground mb-6">
      {slug === "logement-stage-kitesurf-hyeres"
        ? "Vous savez où dormir pour votre stage de kitesurf à Hyères. Il ne vous reste plus qu'à réserver votre place pour enchaîner les sessions sur le spot de l'Almanarre."
        : "Réservez votre stage et venez vivre ces sensations sur le spot de l'Almanarre."}
    </p>
    <div className="flex flex-wrap justify-center gap-4">
      <Button variant="sunset" size="lg" asChild>
        <Link to="/contact-reservation-kitesurf-hyeres">
          {slug === "logement-stage-kitesurf-hyeres" ? "Réserver mon stage" : "Réserver un Stage"}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les Tarifs</Link>
      </Button>
    </div>
  </div>
);
