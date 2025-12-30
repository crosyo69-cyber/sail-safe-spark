import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { NewsletterForm } from "@/components/NewsletterForm";
import logoFfvl from "@/assets/logo-ffvl.png";
import logoEfk from "@/assets/logo-efk.png";
import logoDuotone from "@/assets/logo-duotone.png";
import logoWelcomeSurfShop from "@/assets/logo-welcome-surf-shop.avif";

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
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy text-primary-foreground">
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
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              Première école de kitesurf du Var, fondée en 1999. Apprenez avec un moniteur diplômé d'État et bénéficiez d'un bateau d'assistance pour votre sécurité.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Youtube className="w-5 h-5" />
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
                  href="mailto:contact@kitesurfpassion.com"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">contact@kitesurfpassion.com</span>
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
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-green-400" />
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
              title="Provence Médical - Partenaire médical"
            >
              <div className="h-10 w-16 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-green-600" />
              </div>
            </a>
          </div>
        </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} KiteSurf Passion. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
