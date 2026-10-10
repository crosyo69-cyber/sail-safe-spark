import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Database, 
  Users, 
  Clock, 
  Lock, 
  Share2, 
  Cookie, 
  UserCheck, 
  Mail,
  FileText,
  Globe,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

const PolitiqueConfidentialite = () => {
  const dataProcessingTable = [
    {
      purpose: "Gestion des demandes de contact",
      data: "Nom, email, téléphone, message",
      basis: "Consentement (Art. 6.1.a)",
      retention: "3 ans après le dernier contact",
    },
    {
      purpose: "Réservation de cours",
      data: "Nom, prénom, email, téléphone, niveau",
      basis: "Exécution du contrat (Art. 6.1.b)",
      retention: "5 ans (obligations légales)",
    },
    {
      purpose: "Alertes météo par email",
      data: "Email, préférences de vent",
      basis: "Consentement (Art. 6.1.a)",
      retention: "Jusqu'au désabonnement",
    },
    {
      purpose: "Newsletter",
      data: "Email",
      basis: "Consentement (Art. 6.1.a)",
      retention: "Jusqu'au désabonnement",
    },
    {
      purpose: "Commentaires blog",
      data: "Email, nom d'affichage, contenu",
      basis: "Consentement (Art. 6.1.a)",
      retention: "Durée de publication de l'article",
    },
    {
      purpose: "Statistiques de fréquentation",
      data: "Données de navigation anonymisées",
      basis: "Intérêt légitime (Art. 6.1.f)",
      retention: "26 mois",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Politique de Confidentialité | Kitesurf Passion Hyères</title>
        <meta 
          name="description" 
          content="Politique de confidentialité de Kitesurf Passion : traitement des données personnelles, droits RGPD, cookies et sécurité des informations." 
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/politique-confidentialite" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/politique-confidentialite" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/politique-confidentialite" />
      </Helmet>

      <Header />

      <main>
        <PageBreadcrumb 
          className="hero-split-breadcrumb"
          items={[
            { label: "Accueil", href: "/" },
            { label: "Politique de Confidentialité" }
          ]} 
        />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-navy to-navy/90 text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 text-turquoise" />
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Protection de vos données personnelles conformément au Règlement Général 
              sur la Protection des Données (RGPD)
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
                Votre confidentialité est notre priorité
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Chez Kitesurf Passion, école de kitesurf, wingfoil, pumpfoil et wakeboard basée à Hyères dans le Var, 
                nous traitons vos données personnelles avec le plus grand sérieux. Cette politique de confidentialité explique 
                comment nous collectons, utilisons, protégeons et gérons les informations que vous nous confiez lors de votre 
                inscription à nos cours, de vos réservations, ou de votre navigation sur notre plateforme.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nous respectons strictement le Règlement Général sur la Protection des Données (RGPD) et la législation 
                française sur la protection des données. Chaque donnée collectée via notre site kitesurfpassion.fr est traitée 
                de manière transparente, sécurisée et légale. Que vous nous contactiez pour réserver un cours de kitesurf à Hyères, 
                vous inscrire à nos alertes météo Almanarre, ou commander un bon cadeau, vos informations sont protégées par 
                des mesures techniques et organisationnelles robustes.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cette politique définit également vos droits inaliénables : accès, rectification, suppression, portabilité et opposition. 
                Nous restons votre interlocuteur privilégié pour l'exercice de ces droits, et nous mettons à votre disposition 
                un contact dédié pour répondre à vos questions ou demandes RGPD.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Besoin d'aide ?</strong> Consultez nos <Link to="/mentions-legales" className="text-primary hover:underline">mentions légales</Link> pour 
                l'identification complète de notre structure, ou contactez-nous directement pour toute préoccupation relative 
                à vos données.
              </p>
            </div>
            
            {/* Introduction */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  La présente politique de confidentialité a pour but de vous informer sur la manière 
                  dont Kitesurf Passion collecte, utilise et protège vos données personnelles, 
                  conformément au Règlement (UE) 2016/679 du Parlement européen et du Conseil du 
                  27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée relative à 
                  l'informatique, aux fichiers et aux libertés.
                </p>
                <p>
                  Nous nous engageons à respecter votre vie privée et à protéger les données 
                  personnelles que vous nous confiez.
                </p>
              </CardContent>
            </Card>

            {/* Responsable du traitement */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  1. Responsable du traitement
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-3">
                <p>Le responsable du traitement des données personnelles est :</p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Kitesurf Passion</strong></p>
                  <p>Représenté par : Yoanne Cros</p>
                  <p>Adresse : 52 Avenue Général de Gaulle, 83320 Carqueiranne, France</p>
                  <p>
                    Email : <a href="mailto:crosyo69@gmail.com" className="text-primary hover:underline">
                      crosyo69@gmail.com
                    </a>
                  </p>
                  <p>
                    Téléphone : <a href="tel:0672716905" className="text-primary hover:underline">
                      06 72 71 69 05
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Données collectées */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary" />
                  2. Données personnelles collectées
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Nous collectons uniquement les données nécessaires aux finalités décrites ci-dessous. 
                  Les données sont collectées de manière loyale et transparente.
                </p>
                
                <h3 className="font-semibold text-foreground mt-6 mb-3">2.1 Données que vous nous fournissez directement</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Formulaire de contact :</strong> nom, prénom, email, téléphone, message</li>
                  <li><strong>Réservation de cours :</strong> nom, prénom, email, téléphone, niveau de pratique, dates souhaitées</li>
                  <li><strong>Inscription newsletter :</strong> adresse email</li>
                  <li><strong>Alertes météo :</strong> adresse email, préférences de vent (min/max)</li>
                  <li><strong>Création de compte :</strong> email, mot de passe (chiffré), nom d'affichage</li>
                  <li><strong>Commentaires blog :</strong> contenu du commentaire, date de publication</li>
                </ul>

                <h3 className="font-semibold text-foreground mt-6 mb-3">2.2 Données collectées automatiquement</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Données de navigation :</strong> adresse IP (anonymisée), type de navigateur, système d'exploitation</li>
                  <li><strong>Cookies :</strong> identifiants de session, préférences de consentement</li>
                  <li><strong>Données analytiques :</strong> pages visitées, durée de visite, source de trafic (avec consentement)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Finalités et bases légales */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  3. Finalités et bases légales du traitement
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border p-3 text-left font-semibold">Finalité</th>
                        <th className="border border-border p-3 text-left font-semibold">Données</th>
                        <th className="border border-border p-3 text-left font-semibold">Base légale</th>
                        <th className="border border-border p-3 text-left font-semibold">Conservation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataProcessingTable.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                          <td className="border border-border p-3">{row.purpose}</td>
                          <td className="border border-border p-3">{row.data}</td>
                          <td className="border border-border p-3">{row.basis}</td>
                          <td className="border border-border p-3">{row.retention}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Durée de conservation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  4. Durée de conservation des données
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Vos données personnelles sont conservées pendant la durée strictement nécessaire 
                  aux finalités pour lesquelles elles ont été collectées :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Données de contact :</strong> 3 ans à compter du dernier contact</li>
                  <li><strong>Données de réservation/facturation :</strong> 5 ans (obligations comptables)</li>
                  <li><strong>Données de newsletter/alertes météo :</strong> jusqu'au désabonnement</li>
                  <li><strong>Données de compte utilisateur :</strong> jusqu'à suppression du compte</li>
                  <li><strong>Cookies analytiques :</strong> 13 mois maximum</li>
                  <li><strong>Journaux de connexion :</strong> 1 an (obligations légales)</li>
                </ul>
                <p>
                  À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.
                </p>
              </CardContent>
            </Card>

            {/* Destinataires */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary" />
                  5. Destinataires des données
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>Vos données personnelles peuvent être transmises aux destinataires suivants :</p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">5.1 Destinataires internes</h3>
                <p>Seul le responsable du traitement (Yoanne Cros) a accès à vos données.</p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">5.2 Sous-traitants</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Supabase Inc.</strong> (Singapour) : hébergement de la base de données et authentification</li>
                  <li><strong>Resend</strong> : envoi des emails transactionnels et alertes météo</li>
                  <li><strong>Google Analytics</strong> (avec consentement) : analyse de fréquentation</li>
                  <li><strong>Lovable/GPT Engineer Inc.</strong> (USA) : hébergement du site web</li>
                </ul>
                <p className="mt-4">
                  Ces sous-traitants sont soumis à des obligations contractuelles strictes en matière 
                  de protection des données et ne peuvent utiliser vos données qu'aux fins définies.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">5.3 Transferts hors UE</h3>
                <p>
                  Certains de nos sous-traitants sont situés en dehors de l'Union Européenne 
                  (États-Unis, Singapour). Ces transferts sont encadrés par des garanties appropriées :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Clauses contractuelles types approuvées par la Commission européenne</li>
                  <li>Certification au Data Privacy Framework (USA) le cas échéant</li>
                </ul>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-primary" />
                  6. Sécurité des données
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
                  pour protéger vos données contre tout accès non autorisé, modification, divulgation 
                  ou destruction :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Chiffrement :</strong> connexions HTTPS/TLS, mots de passe hashés</li>
                  <li><strong>Contrôle d'accès :</strong> authentification sécurisée, Row Level Security (RLS)</li>
                  <li><strong>Sécurité des serveurs :</strong> pare-feu, mises à jour régulières</li>
                  <li><strong>Headers de sécurité :</strong> CSP, HSTS, X-Frame-Options</li>
                  <li><strong>Minimisation :</strong> collecte limitée aux données strictement nécessaires</li>
                  <li><strong>Sensibilisation :</strong> formation aux bonnes pratiques</li>
                </ul>
              </CardContent>
            </Card>

            {/* Droits des utilisateurs */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-primary" />
                  7. Vos droits
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
                </p>
                
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit d'accès</h4>
                    <p className="text-sm">Obtenir la confirmation que vos données sont traitées et en recevoir une copie.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit de rectification</h4>
                    <p className="text-sm">Demander la correction de données inexactes ou incomplètes.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit à l'effacement</h4>
                    <p className="text-sm">Demander la suppression de vos données (« droit à l'oubli »).</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit à la limitation</h4>
                    <p className="text-sm">Demander la suspension temporaire du traitement.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit à la portabilité</h4>
                    <p className="text-sm">Recevoir vos données dans un format structuré et lisible.</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Droit d'opposition</h4>
                    <p className="text-sm">Vous opposer au traitement pour des motifs légitimes.</p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Comment exercer vos droits ?
                  </h4>
                  <p className="text-sm">
                    Envoyez votre demande par email à{" "}
                    <a href="mailto:crosyo69@gmail.com" className="text-primary hover:underline">
                      crosyo69@gmail.com
                    </a>{" "}
                    en précisant votre identité et le droit que vous souhaitez exercer. 
                    Nous répondrons dans un délai d'un mois.
                  </p>
                </div>

                <p className="mt-4">
                  <strong>Droit de retrait du consentement :</strong> Lorsque le traitement est fondé 
                  sur votre consentement, vous pouvez le retirer à tout moment (ex : désabonnement newsletter, 
                  modification des préférences cookies).
                </p>
                
                <p>
                  <strong>Droit d'introduire une réclamation :</strong> Si vous estimez que le traitement 
                  de vos données n'est pas conforme, vous pouvez introduire une réclamation auprès de la 
                  CNIL :{" "}
                  <a 
                    href="https://www.cnil.fr/fr/plaintes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    www.cnil.fr/fr/plaintes
                  </a>
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cookie className="w-6 h-6 text-primary" />
                  8. Politique de cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Notre site utilise des cookies pour améliorer votre expérience de navigation. 
                  Un cookie est un petit fichier texte stocké sur votre appareil.
                </p>
                
                <h3 className="font-semibold text-foreground mt-4 mb-2">Types de cookies utilisés</h3>
                
                <div className="space-y-3">
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Cookies strictement nécessaires</h4>
                    <p className="text-sm mt-1">
                      Indispensables au fonctionnement du site (session, préférences de consentement). 
                      Ils ne peuvent pas être désactivés.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Durée : session ou 13 mois</p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Cookies analytiques</h4>
                    <p className="text-sm mt-1">
                      Nous permettent de mesurer l'audience et d'améliorer le site (Google Analytics). 
                      Soumis à votre consentement.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Durée : 13 mois maximum</p>
                  </div>
                  
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Cookies marketing</h4>
                    <p className="text-sm mt-1">
                      Utilisés pour afficher des publicités personnalisées. 
                      Soumis à votre consentement.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Durée : variable selon le fournisseur</p>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mt-6 mb-2">Gestion de vos préférences</h3>
                <p>
                  Lors de votre première visite, une bannière vous permet de choisir les cookies que 
                  vous acceptez. Vous pouvez modifier vos préférences à tout moment en cliquant sur le 
                  lien "Gérer mes cookies" dans le pied de page.
                </p>
                <p className="mt-2">
                  Vous pouvez également configurer votre navigateur pour bloquer tous les cookies, 
                  mais certaines fonctionnalités du site pourraient ne plus fonctionner correctement.
                </p>
              </CardContent>
            </Card>

            {/* Mineurs */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  9. Protection des mineurs
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Notre site n'est pas destiné aux enfants de moins de 16 ans. Nous ne collectons pas 
                  sciemment de données personnelles concernant des mineurs sans le consentement de 
                  leurs parents ou tuteurs légaux.
                </p>
                <p>
                  Pour les cours de kitesurf destinés aux mineurs, les données sont collectées auprès 
                  des parents ou tuteurs légaux qui donnent leur consentement au nom de l'enfant.
                </p>
              </CardContent>
            </Card>

            {/* Modifications */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-primary" />
                  10. Modifications de la politique
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout 
                  moment. Les modifications seront publiées sur cette page avec une date de mise à jour.
                </p>
                <p>
                  En cas de modification substantielle, nous vous en informerons par email si vous êtes 
                  inscrit à notre newsletter ou aux alertes météo.
                </p>
                <p>
                  Nous vous encourageons à consulter régulièrement cette page pour rester informé de 
                  nos pratiques en matière de protection des données.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Contact */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Des questions sur vos données ?
                  </h2>
                  <p className="text-muted-foreground">
                    Pour toute question relative à cette politique ou pour exercer vos droits, contactez-nous :
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                      href="mailto:crosyo69@gmail.com" 
                      className="inline-flex items-center justify-center gap-2 text-primary font-medium hover:underline"
                    >
                      <Mail className="w-5 h-5" />
                      crosyo69@gmail.com
                    </a>
                    <a 
                      href="tel:0672716905" 
                      className="inline-flex items-center justify-center gap-2 text-primary font-medium hover:underline"
                    >
                      <span>📞</span>
                      06 72 71 69 05
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Voir aussi nos{" "}
                    <Link to="/mentions-legales" className="text-primary hover:underline">
                      Mentions Légales
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PolitiqueConfidentialite;
