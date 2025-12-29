import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { name: "Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
  { name: "Location", href: "/location-materiel-kitesurf-hyeres" },
  { name: "Tarifs", href: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { name: "Le Spot", href: "/spot-kitesurf-almanarre-hyeres-var" },
  { name: "Contact", href: "/contact-reservation-kitesurf-hyeres" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-turquoise rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-display font-black text-lg">KP</span>
          </div>
          <div className="hidden sm:block">
            <span className={cn(
              "font-display font-bold text-lg transition-colors",
              isScrolled ? "text-foreground" : "text-primary-foreground"
            )}>
              KiteSurf Passion
            </span>
            <p className={cn(
              "text-xs transition-colors",
              isScrolled ? "text-muted-foreground" : "text-primary-foreground/70"
            )}>
              Hyères • Depuis 1999
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-300",
                location.pathname === item.href
                  ? isScrolled
                    ? "bg-primary/10 text-primary"
                    : "bg-primary-foreground/20 text-primary-foreground"
                  : isScrolled
                    ? "text-foreground hover:bg-muted"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <a href="tel:0672716905" className="hidden sm:block">
            <Button variant={isScrolled ? "sunset" : "heroFilled"} size="default">
              <Phone className="w-4 h-4" />
              06 72 71 69 05
            </Button>
          </a>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-primary-foreground")} />
            ) : (
              <Menu className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-primary-foreground")} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-xl border-b border-border animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-4 py-3 rounded-lg font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <a href="tel:0672716905" className="mt-2">
              <Button variant="sunset" size="lg" className="w-full">
                <Phone className="w-4 h-4" />
                06 72 71 69 05
              </Button>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
