import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

import heroKitesurf from "@/assets/kitesurf-hyeres.jpg";
import wingfoil from "@/assets/wingfoil-hyeres.jpg";
import pumpfoil from "@/assets/pumpfoil-dock-start.jpg";
import foilTracte from "@/assets/foil-tracte-hyeres.jpg";
import wakeboard from "@/assets/wakeboard-hyeres.jpg";
import bateauSecurite from "@/assets/bateau-assistance-kitesurf.jpg";
import almanarre from "@/assets/almanarre-sunset.jpg";
import kitesurfLesson from "@/assets/kitesurf-cours-hyeres.jpg";
import downwind from "@/assets/downwind.jpg";

const galleryImages = [
  {
    src: heroKitesurf,
    alt: "Kitesurf Hyères Almanarre - Session kitefoil école KiteSurf Passion Var",
    title: "Kitesurf",
    category: "Kitesurf"
  },
  {
    src: wingfoil,
    alt: "Cours wingfoil Hyères Almanarre - Stage wing foil école KiteSurf Passion Var",
    title: "Wing Foil",
    category: "Wing Foil"
  },
  {
    src: pumpfoil,
    alt: "Pumpfoil Hyères dock start - Cours pump foil école KiteSurf Passion Almanarre Var",
    title: "Pumpfoil",
    category: "Pumpfoil"
  },
  {
    src: foilTracte,
    alt: "Foil tracté Hyères - Session foil remorqué bateau école KiteSurf Passion Almanarre Var",
    title: "Foil Tracté",
    category: "Foil Tracté"
  },
  {
    src: wakeboard,
    alt: "Wakeboard Hyères - Session wakeboard tractée bateau école KiteSurf Passion Almanarre Var",
    title: "Wakeboard",
    category: "Wakeboard"
  },
  {
    src: bateauSecurite,
    alt: "Bateau d'assistance de l'école de kitesurf Hyères Almanarre",
    title: "Bateau d'Assistance",
    category: "Sécurité"
  },
  {
    src: almanarre,
    alt: "Coucher de soleil sur le spot de l'Almanarre",
    title: "Spot Almanarre",
    category: "Le Spot"
  },
  {
    src: kitesurfLesson,
    alt: "Cours kitesurf Hyères - Formation encadrée école KiteSurf Passion Almanarre",
    title: "Cours Encadrés",
    category: "Formation"
  },
  {
    src: downwind,
    alt: "Session downwind en kitesurf",
    title: "Downwind",
    category: "Kitesurf"
  },
];

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Notre Univers
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Galerie{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
              Photo
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez nos activités nautiques sur les plus beaux spots de la baie d'Hyères. 
            Kitesurf, wingfoil, pumpfoil et wakeboard dans un cadre exceptionnel.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "group relative overflow-hidden rounded-2xl aspect-square cursor-pointer",
                "transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20",
                // Make first and fifth images larger on desktop
                index === 0 && "md:col-span-2 md:row-span-2",
                index === 5 && "lg:col-span-2"
              )}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                priority={index < 2}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                wrapperClassName="w-full h-full"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-turquoise text-xs font-medium mb-1">
                  {image.category}
                </span>
                <h3 className="text-primary-foreground font-display font-semibold text-lg">
                  {image.title}
                </h3>
              </div>

              {/* Corner accent */}
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary-foreground/50 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent">
                  <span className="text-primary text-sm font-medium">
                    {selectedImage.category}
                  </span>
                  <h3 className="text-foreground font-display font-bold text-xl">
                    {selectedImage.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedImage.alt}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
