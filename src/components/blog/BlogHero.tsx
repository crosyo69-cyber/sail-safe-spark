import { blogHeroImage } from "@/features/blog";

export const BlogHero = () => (
  <section className="hero-split">
    <div className="hero-split-photo">
      <img
        src={blogHeroImage}
        alt="Blog kitesurf wingfoil pumpfoil - Presqu'île de Giens"
        className="w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
    </div>

    <div className="hero-split-panel">
      <div className="max-w-2xl">
        <span className="inline-block text-sunset font-semibold mb-4">Blog &amp; Actualités</span>
        <h1 className="font-display text-[2.25rem] leading-[1.05] sm:text-5xl xl:text-6xl font-black text-primary-foreground mb-5">
          Conseils d'Experts &amp; Guides Pratiques
        </h1>
        <p className="text-primary-foreground/80 text-lg mb-8">
          25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités du kitesurf à Hyères.
        </p>
      </div>
    </div>
  </section>
);
