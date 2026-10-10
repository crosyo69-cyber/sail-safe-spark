import { useState, useEffect, useRef } from "react";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { trackPhoneClick } from "@/lib/analytics";
import { trackMetaContact } from "@/lib/meta-pixel";

const navigation = [
  { name: "Accueil", href: "/" },
  { 
    name: "Kitesurf", 
    href: "/cours-kitesurf-hyeres-debutant",
    submenu: [
      { name: "Stage 100% Glisse", href: "/stage-kitesurf-100-glisse-hyeres" },
      { name: "Cours à la Carte", href: "/session-kitesurf-carte-hyeres" },
      { name: "Cours Particulier", href: "/cours-particulier-kitesurf-hyeres" },
      { name: "Wakeboard", href: "/wakeboard-hyeres" },
    ]
  },
  { 
    name: "Wing Foil", 
    href: "/stage-wingfoil-hyeres-almanarre",
    submenu: [
      { name: "Stage Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
      { name: "Pump Foil", href: "/cours-pumpfoil-dock-start-hyeres" },
      { name: "Foil Tracté", href: "/foil-tracte-hyeres" },
    ]
  },
  { 
    name: "Location", 
    href: "/location-materiel-kitesurf-hyeres",
    submenu: [
      { name: "Location Matériel", href: "/location-materiel-kitesurf-hyeres" },
      { name: "Déposes en Mer", href: "/deposes-mer-kitesurf-hyeres" },
      { name: "E-Foil & Assist Foil", href: "/efoil-assist-foil-hyeres" },
    ]
  },
  { name: "Tarifs", href: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { name: "Le Spot", href: "/spot-kitesurf-almanarre-hyeres-var" },
  { name: "Blog", href: "/blog-kitesurf-hyeres" },
  { name: "À Propos", href: "/a-propos-ecole-kitesurf-hyeres" },
  { name: "Contact", href: "/contact-reservation-kitesurf-hyeres" },
];

export function Header() {
  const [hasScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  // Pages whose top is light (no navy hero/breadcrumb band): keep the solid header so text stays readable
  const LIGHT_TOP_PAGES = [
    "/tarifs-cours-kitesurf-wingfoil-hyeres",
    "/contact-reservation-kitesurf-hyeres",
    "/a-propos-ecole-kitesurf-hyeres",
  ];
  const isScrolled = hasScrolled || LIGHT_TOP_PAGES.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      // Always show header, just change styling based on scroll position
      setIsScrolled(window.scrollY > 20);
    };
    
    // Check initial scroll position on mount
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => header.style.setProperty("--mobile-header-height", `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      setOpenSubmenu(null);
      menuButtonRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
      Object.assign(body.style, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [isMobileMenuOpen]);

  const isActiveLink = (href: string, submenu?: { name: string; href: string }[]) => {
    if (location.pathname === href) return true;
    if (submenu) {
      return submenu.some(item => location.pathname === item.href);
    }
    return false;
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "site-header fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg py-2"
          : "bg-navy py-4"
      )}
      style={{ 
        contain: 'layout style',
        minHeight: '72px', // Prevent CLS
      }}
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
            <div key={item.name} className="relative group">
              {item.submenu ? (
                <>
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1",
                      isActiveLink(item.href, item.submenu)
                        ? isScrolled
                          ? "bg-primary/10 text-primary"
                          : "bg-primary-foreground/20 text-primary-foreground"
                        : isScrolled
                          ? "text-foreground hover:bg-muted"
                          : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    )}
                  >
                    {item.name}
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-background/98 backdrop-blur-xl rounded-xl border border-border shadow-lg py-2 min-w-[200px]">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={cn(
                            "block px-4 py-2 font-medium transition-colors",
                            location.pathname === subItem.href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
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
              )}
            </div>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <a 
            href="tel:0672716905" 
            className="hidden sm:block"
            onClick={() => { trackPhoneClick("header"); trackMetaContact({ content_name: "phone_click", content_category: "header" }); }}
          >
            <Button variant={isScrolled ? "sunset" : "heroFilled"} size="default">
              <Phone className="w-4 h-4" />
              06 72 71 69 05
            </Button>
          </a>

          {/* Mobile Menu Button */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            type="button"
            className="mobile-menu-toggle lg:hidden p-2 rounded-lg min-h-11 min-w-11"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-primary-foreground")} />
            ) : (
              <Menu className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-primary-foreground")} />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="mobile-menu-panel lg:hidden absolute top-full left-0 right-0">
          <nav className="container mx-auto px-4 py-4 flex flex-col">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.submenu ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                      aria-expanded={openSubmenu === item.name}
                      aria-controls={`mobile-submenu-${item.name.replaceAll(" ", "-")}`}
                      className="mobile-menu-link w-full px-4 font-medium flex items-center justify-between"
                    >
                      {item.name}
                      <ChevronDown className={cn("w-5 h-5 shrink-0 transition-transform", openSubmenu === item.name && "rotate-180")} />
                    </Button>
                    {openSubmenu === item.name && (
                      <div id={`mobile-submenu-${item.name.replaceAll(" ", "-")}`} className="mobile-menu-submenu ml-4">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.name} to={subItem.href}
                            className="mobile-menu-link flex items-center px-4 font-medium"
                            onClick={() => setIsMobileMenuOpen(false)}>
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link to={item.href} className="mobile-menu-link flex items-center px-4 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <a href="tel:0672716905" className="mobile-menu-phone mt-4"
              onClick={() => { setIsMobileMenuOpen(false); trackPhoneClick("mobile_menu"); trackMetaContact({ content_name: "phone_click", content_category: "mobile_menu" }); }}>
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
