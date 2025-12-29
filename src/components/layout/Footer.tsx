import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  activities: [
    { name: "Cours Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
    { name: "Stage Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
    { name: "Initiation Pump Foil", href: "/cours-pumpfoil-dock-start-hyeres" },
    { name: "Downwind Foil", href: "/contact-reservation-kitesurf-hyeres" },
  ],
  quickLinks: [
    { name: "Accueil", href: "/" },
    { name: "Tarifs", href: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
    { name: "Le Spot Almanarre", href: "/spot-kitesurf-almanarre-hyeres-var" },
    { name: "Notre Histoire", href: "/ecole-kitesurf-hyeres-depuis-1999" },
    { name: "Bons Cadeaux", href: "/bon-cadeau-stage-kitesurf-hyeres" },
    { name: "Blog", href: "/blog-kitesurf-wingfoil-hyeres" },
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

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:0488927183"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  <div className="w-10 h-10 bg-sunset/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-sunset" />
                  </div>
                  <span className="text-sm">04 88 92 71 83</span>
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
            </ul>
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
