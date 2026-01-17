import { forwardRef } from "react";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Cookie, Rss } from "lucide-react";
import { Link } from "react-router-dom";
import { NewsletterForm } from "@/components/NewsletterForm";
import { openCookiePreferences } from "@/components/CookieConsent";
import logoFfvl from "@/assets/logo-ffvl.png";
import logoEfk from "@/assets/logo-efk.png";
import logoDuotone from "@/assets/logo-duotone.png";
import logoWelcomeSurfShop from "@/assets/logo-welcome-surf-shop.avif";
import logoOtHyeres from "@/assets/logo-ot-hyeres.png";
import logoOtCarqueiranne from "@/assets/logo-ot-carqueiranne.jpg";
import logoTripadvisor from "@/assets/logo-tripadvisor.png";
import logoSpeedkart from "@/assets/logo-speedkart.jpg";
import logoProvenceMed from "@/assets/logo-provence-med.png";
import logoThespot2be from "@/assets/logo-thespot2be.png";
import logoHotelRichiardi from "@/assets/logo-hotel-richiardi.png";
import logoVisitvar from "@/assets/logo-visitvar.png";
import logoPagesjaunes from "@/assets/logo-pagesjaunes.png";
import logoWanderlog from "@/assets/logo-wanderlog.png";
import logoBiereIlesDor from "@/assets/logo-biere-iles-dor.png";
import logoCitoofrance from "@/assets/logo-citoofrance.png";

const footerLinks = {
  activities: [
    { name: "Cours Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
    { name: "Stage Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
    { name: "Initiation Pump Foil", href: "/cours-pumpfoil-dock-start-hyeres" },
    { name: "Foil Tracté", href: "/foil-tracte-hyeres" },
    { name: "Wakeboard", href: "/wakeboard-hyeres" },
  ],
  quickLinks: [
    { name: "Accueil", href: "/" },
    { name: "Tarifs", href: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
    { name: "Le Spot Almanarre", href: "/spot-kitesurf-almanarre-hyeres-var" },
    { name: "Blog", href: "/blog-kitesurf-hyeres" },
    { name: "À Propos", href: "/a-propos-ecole-kitesurf-hyeres" },
    { name: "Contact", href: "/contact-reservation-kitesurf-hyeres" },
  ],
  legal: [
    { name: "Mentions Légales", href: "/mentions-legales" },
    { name: "Politique de Confidentialité", href: "/politique-confidentialite" },
    { name: "llms.txt", href: "/llms.txt", external: true },
    { name: "security.txt", href: "/.well-known/security.txt", external: true },
    { name: "humans.txt", href: "/humans.txt", external: true },
  ],
};

const CookieLink = () => (
  <button
    onClick={openCookiePreferences}
    className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm"
  >
    <Cookie className="w-4 h-4" />
    Gérer mes cookies
  </button>
);

export const Footer = forwardRef<HTMLElement, object>(function Footer(_, ref) {
  return (
    <footer ref={ref} className="bg-navy text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-turquoise rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-display font-black text-lg">KP</span>
              </div>
              <div>
                <span className="font-display font-bold text-lg">KiteSurf Passion</span>
                <p className="text-xs text-primary-foreground/60">Hyères • Depuis 1999</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-4">
              Première école de kitesurf du Var, fondée en 1999. Apprenez avec un moniteur diplômé d'État et bénéficiez d'un bateau d'assistance pour votre sécurité.
            </p>
            <p className="text-primary-foreground/60 text-xs mb-3 italic">
              Suivez-nous sur les réseaux sociaux pour plus de contenu et d'actualités !
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/kitesurfpassion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 group"
                aria-label="Suivez-nous sur Facebook"
                title="Facebook KiteSurf Passion"
              >
                <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://www.instagram.com/kitesurfpassion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white transition-all duration-300 group"
                aria-label="Suivez-nous sur Instagram"
                title="Instagram KiteSurf Passion"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://www.linkedin.com/company/kitesurf-passion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all duration-300 group"
                aria-label="Suivez-nous sur LinkedIn"
                title="LinkedIn KiteSurf Passion"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://www.youtube.com/@yoanne0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all duration-300 group"
                aria-label="Regardez nos vidéos sur YouTube"
                title="YouTube KiteSurf Passion"
              >
                <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-[#FFA500] hover:text-white transition-all duration-300 group"
                aria-label="S'abonner au flux RSS"
                title="Flux RSS du blog"
              >
                <Rss className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
            
            {/* Logos FFVL/EFK */}
            <div className="mt-6 pt-4 border-t border-primary-foreground/10">
              <p className="text-xs text-primary-foreground/60 mb-1">École FFVL labellisée EFK</p>
              <p className="text-xs text-primary-foreground/50 mb-3 font-mono">N° Affiliation : 01926</p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://ffvl.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 rounded-lg p-2 hover:bg-white transition-colors"
                  title="Fédération Française de Vol Libre"
                >
                  <img 
                    src={logoFfvl} 
                    alt="Logo FFVL labellisée EFK - École de kitesurf certifiée" 
                    className="h-10 w-auto object-contain"
                  />
                </a>
                <a 
                  href="https://ffvl.fr/ecole-francaise-kite" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 rounded-lg p-2 hover:bg-white transition-colors"
                  title="École Française de Kite"
                >
                  <img 
                    src={logoEfk} 
                    alt="Logo FFVL labellisée EFK - École de kitesurf certifiée" 
                    className="h-10 w-auto object-contain"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Liens Rapides</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Activities */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Nos Activités</h3>
            <ul className="space-y-3">
              {footerLinks.activities.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Contact</h3>
            <ul className="space-y-4 mb-6">
              <li>
                <a
                  href="tel:0672716905"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  <div className="w-10 h-10 bg-sunset/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-sunset" />
                  </div>
                  <span className="text-sm">06 72 71 69 05</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:crosyo69@gmail.com"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">crosyo69@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/70">
                <div className="w-10 h-10 bg-turquoise/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-turquoise" />
                </div>
                <span className="text-sm">
                  52 Avenue Général de Gaulle<br />
                  83320 Carqueiranne
                </span>
              </li>
              <li>
                <a
                  href="https://www.provencemed.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  title="Provence Médical - Partenaire école kitesurf"
                >
                  <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={logoProvenceMed} 
                      alt="Provence Médical - Partenaire école kitesurf" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm">www.provencemed.com</span>
                </a>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="pt-4 border-t border-primary-foreground/10">
              <h4 className="font-display font-semibold text-sm mb-3">Newsletter</h4>
              <p className="text-primary-foreground/60 text-xs mb-3">
                Recevez nos conseils et prévisions météo
              </p>
              <NewsletterForm variant="footer" />
            </div>
            
          </div>
        </div>

        {/* Partenaires */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <h3 className="font-display font-bold text-lg text-center mb-6">Nos Partenaires</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <a 
              href="https://www.duotonesports.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Duotone Kiteboarding"
            >
              <img 
                src={logoDuotone} 
                alt="Logo Duotone - Partenaire école kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.welcomesurfshop.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Welcome Surf Shop"
            >
              <img 
                src={logoWelcomeSurfShop} 
                alt="Logo Welcome Surf Shop - Partenaire école kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.provencemed.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Provence Méditerranée - Partenaire médical"
            >
              <img 
                src={logoProvenceMed} 
                alt="Provence Médical - Partenaire école kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Offices de Tourisme & Partenaires */}
        <div className="mt-8 pt-6 border-t border-primary-foreground/10">
          <h3 className="font-display font-bold text-lg text-center mb-6">Offices de Tourisme & Partenaires</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <a 
              href="https://hyeres.fr/un-nouveau-site-internet-pour-loffice-de-tourisme-provence-mediterranee/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Office de Tourisme Hyères"
            >
              <img 
                src={logoOtHyeres} 
                alt="Office de Tourisme Hyères" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.carqueiranne.fr/se-divertir/tourisme/office-de-tourisme-673.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Office de Tourisme Carqueiranne"
            >
              <img 
                src={logoOtCarqueiranne} 
                alt="Office de Tourisme Carqueiranne" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.tripadvisor.fr/Attraction_Review-g1080042-d9464816-Reviews-Kitesurf_Passion-Carqueiranne_Var_Provence_Alpes_Cote_d_Azur.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="TripAdvisor Kitesurf Passion"
            >
              <img 
                src={logoTripadvisor} 
                alt="TripAdvisor Kitesurf Passion" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.speedkart.fr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Speedkart"
            >
              <img 
                src={logoSpeedkart} 
                alt="Speedkart partenaire" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://thespot2be.com/ecole/328c1fe0367717f6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="TheSpot2be - Plateforme spots kitesurf"
            >
              <img 
                src={logoThespot2be} 
                alt="TheSpot2be - Partenaire école kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.hotelrichiardi.com/fr/situation/kitesurf-passion-carqueiranne" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Hôtel Richiardi - Hébergement partenaire"
            >
              <img 
                src={logoHotelRichiardi} 
                alt="Hôtel Richiardi - Partenaire hébergement école kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.visitvar.fr/fiche/kite-surf-passion-4627343" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Visit Var - Tourisme Var"
            >
              <img 
                src={logoVisitvar} 
                alt="Visit Var - Tourisme département du Var" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.pagesjaunes.fr/pros/51934489" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Pages Jaunes - Annuaire professionnel"
            >
              <img 
                src={logoPagesjaunes} 
                alt="Pages Jaunes - Fiche professionnelle Kitesurf Passion" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://wanderlog.com/fr/place/details/653258/kitesurf-passion" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Wanderlog - Guide voyage"
            >
              <img 
                src={logoWanderlog} 
                alt="Wanderlog - Kitesurf Passion guide voyage" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.labieredesilesdor.fr/lien-surf+et+wing+surf+carqueiranne+kitesurf+passion-108.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="La Bière des Îles d'Or - Brasserie artisanale"
            >
              <img 
                src={logoBiereIlesDor} 
                alt="La Bière des Îles d'Or - Partenaire brasserie artisanale" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <a 
              href="https://citoofrance.com/ecole/hyeres/kitesurf-passion/#google_vignette" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 rounded-lg p-3 hover:bg-white transition-colors grayscale hover:grayscale-0"
              title="Citoo France - Annuaire écoles de kitesurf"
            >
              <img 
                src={logoCitoofrance} 
                alt="Citoo France - Annuaire des écoles de kitesurf" 
                className="h-10 w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} KiteSurf Passion. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {footerLinks.legal.map((link) => (
              'external' in link && link.external ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors text-sm font-mono"
                  title="Fichier pour les crawlers IA"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors text-sm"
                >
                  {link.name}
                </Link>
              )
            ))}
            <CookieLink />
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
