import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Server, Copyright, Shield, Mail, Phone, MapPin } from "lucide-react";

const MentionsLegales = () => {
  const sections = [
    {
      icon: Building2,
      title: "1. Éditeur du site",
      content: (
        <div className="space-y-3">
          <p><strong>Raison sociale :</strong> Kitesurf Passion</p>
          <p><strong>Forme juridique :</strong> Entreprise individuelle</p>
          <p><strong>Responsable de la publication :</strong> Yoanne Cros</p>
          <p><strong>Adresse du siège social :</strong></p>
          <p className="flex items-start gap-2 ml-4">
            <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
            52 Avenue Général de Gaulle, 83320 Carqueiranne, France
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <a href="tel:0672716905" className="text-primary hover:underline">06 72 71 69 05</a>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <a href="mailto:crosyo69@gmail.com" className="text-primary hover:underline">crosyo69@gmail.com</a>
          </p>
          <p><strong>SIRET :</strong> 432 262 129 00039</p>
          <p><strong>Code APE :</strong> 8551Z - Enseignement de disciplines sportives et d'activités de loisirs</p>
          <p><strong>Numéro d'affiliation FFVL :</strong> 01926</p>
          <p><strong>Diplôme :</strong> BPJEPS Activités Nautiques mention Kitesurf</p>
        </div>
      ),
    },
    {
      icon: Server,
      title: "2. Hébergement",
      content: (
        <div className="space-y-3">
          <p>Le site kitesurfpassion.fr est hébergé par :</p>
          <p><strong>Lovable (GPT Engineer Inc.)</strong></p>
          <p>2261 Market Street #4010</p>
          <p>San Francisco, CA 94114</p>
          <p>États-Unis</p>
          <p className="mt-4">
            <strong>Infrastructure technique :</strong> Supabase Inc.
          </p>
          <p>970 Toa Payoh North #07-04</p>
          <p>Singapore 318992</p>
        </div>
      ),
    },
    {
      icon: Copyright,
      title: "3. Propriété intellectuelle",
      content: (
        <div className="space-y-3">
          <p>
            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur 
            et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour 
            les documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
          <p>
            La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est 
            formellement interdite sauf autorisation expresse du directeur de la publication.
          </p>
          <p><strong>Éléments protégés :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Le logo et la marque "Kitesurf Passion"</li>
            <li>Les textes, articles et contenus rédactionnels</li>
            <li>Les photographies et vidéos</li>
            <li>La charte graphique et le design du site</li>
            <li>Les bases de données</li>
          </ul>
          <p className="mt-4">
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie 
            des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf 
            autorisation écrite préalable de Kitesurf Passion.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "4. Protection des données personnelles (RGPD)",
      content: (
        <div className="space-y-3">
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi 
            "Informatique et Libertés" du 6 janvier 1978 modifiée, vous disposez des droits suivants 
            concernant vos données personnelles :
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Droit d'accès :</strong> obtenir la confirmation du traitement de vos données</li>
            <li><strong>Droit de rectification :</strong> demander la correction de données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la limitation :</strong> demander la limitation du traitement</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
          </ul>
          
          <p className="mt-4"><strong>Responsable du traitement :</strong></p>
          <p>Yoanne Cros - Kitesurf Passion</p>
          <p>Email : <a href="mailto:crosyo69@gmail.com" className="text-primary hover:underline">crosyo69@gmail.com</a></p>
          
          <p className="mt-4"><strong>Données collectées :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Formulaire de contact : nom, email, téléphone, message</li>
            <li>Inscription newsletter : email</li>
            <li>Alertes météo : email, préférences de vent</li>
            <li>Commentaires blog : email, nom d'affichage (compte utilisateur)</li>
            <li>Cookies : préférences de navigation, analytics (avec consentement)</li>
          </ul>
          
          <p className="mt-4"><strong>Finalités du traitement :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Répondre à vos demandes de renseignements</li>
            <li>Gérer les réservations de cours</li>
            <li>Envoyer des alertes météo personnalisées</li>
            <li>Améliorer l'expérience utilisateur du site</li>
            <li>Établir des statistiques de fréquentation anonymisées</li>
          </ul>
          
          <p className="mt-4"><strong>Durée de conservation :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Données de contact : 3 ans après le dernier contact</li>
            <li>Données de réservation : 5 ans (obligations légales)</li>
            <li>Cookies : 13 mois maximum</li>
          </ul>
          
          <p className="mt-4">
            Pour exercer vos droits ou pour toute question relative à la protection de vos données, 
            contactez-nous par email à{" "}
            <a href="mailto:crosyo69@gmail.com" className="text-primary hover:underline">
              crosyo69@gmail.com
            </a>.
          </p>
          
          <p className="mt-4">
            En cas de litige, vous pouvez introduire une réclamation auprès de la CNIL (Commission 
            Nationale de l'Informatique et des Libertés) :{" "}
            <a 
              href="https://www.cnil.fr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.cnil.fr
            </a>
          </p>
        </div>
      ),
    },
  ];

  const additionalSections = [
    {
      title: "5. Cookies",
      content: (
        <div className="space-y-3">
          <p>
            Le site utilise des cookies pour améliorer l'expérience utilisateur. Lors de votre première 
            visite, une bannière vous permet de gérer vos préférences en matière de cookies.
          </p>
          <p><strong>Types de cookies utilisés :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Cookies nécessaires :</strong> indispensables au fonctionnement du site</li>
            <li><strong>Cookies analytiques :</strong> mesure d'audience (Google Analytics) - avec consentement</li>
            <li><strong>Cookies marketing :</strong> publicités ciblées - avec consentement</li>
          </ul>
          <p className="mt-4">
            Vous pouvez modifier vos préférences à tout moment via le lien "Gérer mes cookies" 
            présent dans le pied de page du site.
          </p>
        </div>
      ),
    },
    {
      title: "6. Limitation de responsabilité",
      content: (
        <div className="space-y-3">
          <p>
            Les informations contenues sur ce site sont aussi précises que possible et le site est 
            régulièrement mis à jour. Toutefois, il peut contenir des inexactitudes ou des omissions.
          </p>
          <p>
            L'utilisateur du site reconnaît utiliser ces informations sous sa responsabilité exclusive.
          </p>
          <p>
            Kitesurf Passion ne pourra être tenue responsable des dommages directs ou indirects 
            résultant de l'accès ou de l'utilisation du site, y compris l'inaccessibilité, les pertes 
            de données, les virus ou tout autre problème technique.
          </p>
          <p>
            Les liens hypertextes vers d'autres sites n'engagent pas la responsabilité de 
            Kitesurf Passion quant au contenu de ces sites.
          </p>
        </div>
      ),
    },
    {
      title: "7. Conditions d'utilisation",
      content: (
        <div className="space-y-3">
          <p>
            L'utilisation du site implique l'acceptation pleine et entière des conditions générales 
            d'utilisation décrites dans les présentes mentions légales.
          </p>
          <p>
            Ces conditions peuvent être modifiées à tout moment sans préavis. L'utilisateur est 
            invité à les consulter régulièrement.
          </p>
        </div>
      ),
    },
    {
      title: "8. Droit applicable et juridiction",
      content: (
        <div className="space-y-3">
          <p>
            Les présentes mentions légales sont régies par le droit français.
          </p>
          <p>
            En cas de litige, et après échec de toute tentative de recherche d'une solution amiable, 
            les tribunaux français seront seuls compétents pour connaître de ce litige.
          </p>
        </div>
      ),
    },
    {
      title: "9. Crédits",
      content: (
        <div className="space-y-3">
          <p><strong>Conception et développement :</strong> Lovable</p>
          <p><strong>Photographies :</strong> Kitesurf Passion / Droits réservés</p>
          <p><strong>Icônes :</strong> Lucide Icons</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mentions Légales | Kitesurf Passion Hyères</title>
        <meta 
          name="description" 
          content="Mentions légales du site Kitesurf Passion : informations sur l'éditeur, l'hébergeur, la propriété intellectuelle et la protection des données personnelles." 
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/mentions-legales" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/mentions-legales" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/mentions-legales" />
      </Helmet>

      <Header />

      <main>
        <PageBreadcrumb 
          className="hero-split-breadcrumb"
          items={[
            { label: "Mentions Légales" }
          ]} 
        />

        {/* Hero Section */}
        <section className="hero-split-panel">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
              Mentions Légales
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Informations légales conformes à la loi pour la confiance dans l'économie numérique (LCEN)
            </p>
            <p className="text-primary-foreground/60 text-sm mt-4">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* SEO Introduction Section */}
            <div className="bg-muted/30 rounded-lg p-8 mb-12 border-l-4 border-primary">
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
                Transparence et conformité légale pour Kitesurf Passion
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Les mentions légales du site Kitesurf Passion à Hyères et Carqueiranne sont établies conformément à la 
                Loi pour la Confiance dans l'Économie Numérique (LCEN) du 21 juin 2004 et à la directive européenne 2000/31/CE. 
                En tant qu'école de kitesurf, de wingfoil, de pumpfoil et de wakeboard basée dans le Var, nous nous engageons 
                à respecter les obligations légales et à vous fournir l'intégralité des informations requises concernant 
                l'exploitation de kitesurfpassion.fr.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ces mentions légales régissent votre accès au site, vos droits en tant qu'utilisateur, et définissent les conditions 
                dans lesquelles Kitesurf Passion opère ses services d'enseignement de disciplines nautiques et de location de matériel. 
                Vous y trouverez également les informations essentielles sur notre hébergeur, nos partenaires techniques, et nos 
                responsabilités légales vis-à-vis de nos stagiaires et utilisateurs du site.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question ou demande concernant la réglementation, le RGPD, ou l'exploitation de notre site web, 
                contactez-nous directement. Ces mentions légales constituent un document vivant, mis à jour régulièrement 
                pour assurer notre conformité totale avec la législation française et européenne.
              </p>
            </div>

            {/* Main Sections with Icons */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <section.icon className="w-6 h-6 text-primary" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 text-muted-foreground leading-relaxed">
                    {section.content}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-12" />

            {/* Additional Sections */}
            <div className="space-y-8">
              {additionalSections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <div className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Box */}
            <Card className="mt-12 bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Pour toute question concernant ces mentions légales, contactez-nous :<br />
                  <a 
                    href="mailto:crosyo69@gmail.com" 
                    className="text-primary font-medium hover:underline"
                  >
                    crosyo69@gmail.com
                  </a>
                  {" "}ou{" "}
                  <a 
                    href="tel:0672716905" 
                    className="text-primary font-medium hover:underline"
                  >
                    06 72 71 69 05
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MentionsLegales;
