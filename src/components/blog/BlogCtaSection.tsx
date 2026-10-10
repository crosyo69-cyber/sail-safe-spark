import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogCtaImage } from "@/features/blog";

export const BlogCtaSection = () => (
  <section className="py-16 relative overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={blogCtaImage}
        alt="Kitesurf au coucher de soleil à Hyères"
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-navy/60" />
    </div>
    <div className="container mx-auto px-4 text-center relative z-10"><div className="bg-navy rounded-2xl px-6 py-10 max-w-2xl mx-auto">
      <h2 className="font-display text-3xl font-bold text-white mb-4">Prêt à Vous Lancer ?</h2>
      <p className="text-white/90 mb-8 max-w-xl mx-auto">
        Passez de la théorie à la pratique avec nos stages encadrés par des professionnels.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="heroFilled" size="lg" asChild>
          <Link to="/contact-reservation-kitesurf-hyeres">
            Réserver un Stage
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <Button variant="hero" size="lg" asChild>
          <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les Tarifs</Link>
        </Button>
      </div>
    </div>
    </div>
  </section>
);
