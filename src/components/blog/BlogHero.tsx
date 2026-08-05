import { blogHeroImage } from "@/features/blog";

export const BlogHero = () => (
  <section className="relative pt-32 pb-20 overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={blogHeroImage}
        alt="Blog kitesurf wingfoil pumpfoil - Presqu'île de Giens"
        className="w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
    </div>

    <div className="relative z-10 container mx-auto px-4">
      <div className="max-w-2xl">
        <span className="inline-block text-sunset font-semibold mb-4">Blog &amp; Actualités</span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
          Conseils d'Experts &amp; Guides Pratiques
        </h1>
        <p className="text-primary-foreground/80 text-lg mb-8">
          25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités du kitesurf à Hyères.
        </p>
      </div>
    </div>
  </section>
);
