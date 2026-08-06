import { Link } from "react-router-dom";
import { TrustBadges } from "./TrustBadges";

/** Expert local content section (SEO long-form). Presentation only. */
export function LocalExpertiseSection() {
  return (
        <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block text-primary font-semibold mb-4">Notre Expertise Locale</span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                  L'École de Kitesurf de Référence à{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Hyères</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  Depuis 1999, KiteSurf Passion forme les riders de demain sur le spot mythique de l'Almanarre. Plus qu'une école, c'est une philosophie d'enseignement unique dans le Var.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Pourquoi l'Almanarre est le meilleur spot pour apprendre</h3>
                  <p>
                    La <strong>plage de l'Almanarre</strong>, située sur la presqu'île de Giens à Hyères, est unanimement considérée comme l'un des <strong>meilleurs spots de kitesurf de Méditerranée</strong>. Ce n'est pas un hasard si nous avons choisi ce lieu il y a plus de 25 ans pour y fonder notre école : les conditions naturelles y sont exceptionnelles pour l'apprentissage.
                  </p>
                  <p>
                    Le spot bénéficie de <strong>deux régimes de vent dominants</strong> — le Mistral (nord-ouest) et le Levant (est) — qui assurent des conditions navigables plus de <strong>200 jours par an</strong>. La configuration géographique unique de la presqu'île crée une lagune protégée côté ouest, avec une <strong>eau plate</strong> idéale pour les débutants, tandis que le côté est offre plus de clapot pour les riders confirmés.
                  </p>
                  <p>
                    La profondeur progressive, le fond sablonneux sans rochers et l'absence de courants dangereux font de l'Almanarre un terrain de jeu parfaitement sécurisé. C'est pourquoi de nombreuses écoles se sont installées ici, mais <strong>KiteSurf Passion reste la seule à proposer un bateau d'assistance permanent</strong> sur chaque session — un avantage décisif pour votre progression et votre sécurité.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Une pédagogie forgée par 25 ans d'expérience</h3>
                  <p>
                    Notre fondateur <strong>Yoanne Cros</strong> est diplômé d'État (BPJEPS) depuis 1999 et <strong>formateur de moniteurs pour la FFVL</strong> (Fédération Française de Vol Libre). Cette double casquette — enseignant et formateur d'enseignants — confère à notre école une expertise pédagogique inégalée dans le Var.
                  </p>
                  <p>
                    Avec plus de <strong>2 500 élèves formés</strong>, nous avons affiné notre méthode pour garantir une progression optimale. Notre approche repose sur trois piliers fondamentaux : la <strong>sécurité maximale</strong> grâce au bateau d'assistance et aux radios de communication, la <strong>personnalisation</strong> avec des groupes de 3 à 4 élèves maximum, et la <strong>qualité du matériel</strong> avec du Duotone dernière génération.
                  </p>
                  <p>
                    Contrairement aux grandes structures qui privilégient le volume, nous misons sur la <strong>qualité de l'encadrement</strong>. Chaque élève bénéficie d'un suivi individualisé, avec des débriefings après chaque session et des conseils adaptés à sa progression personnelle. C'est cette approche humaine et passionnée qui explique notre <strong>note de 4,9/5</strong> basée sur les retours de nos élèves.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Le bateau d'assistance : notre avantage décisif</h3>
                  <p>
                    Le <strong>bateau d'assistance</strong> est au cœur de notre pédagogie. Présent sur chaque session, il remplit trois fonctions essentielles qui accélèrent considérablement votre apprentissage du kitesurf ou du wingfoil à Hyères.
                  </p>
                  <p>
                    <strong>Sécurité :</strong> en cas de dérive, de perte de matériel ou de difficulté, le bateau vous récupère en quelques minutes. Vous n'avez jamais besoin de marcher des centaines de mètres pour revenir au point de départ — un gain de temps et d'énergie considérable qui se traduit directement en <strong>temps de pratique supplémentaire</strong>.
                  </p>
                  <p>
                    <strong>Pédagogie :</strong> grâce aux <strong>radios de communication</strong>, votre moniteur peut vous guider en temps réel depuis le bateau pendant que vous êtes dans l'eau. Des corrections immédiates, des encouragements ciblés : c'est comme avoir votre coach personnel à vos côtés en permanence.
                  </p>
                  <p>
                    <strong>Polyvalence :</strong> les jours sans vent, le bateau nous permet de proposer des <Link to="/foil-tracte-hyeres" className="text-primary hover:underline">sessions de foil tracté</Link> ou du <Link to="/wakeboard-hyeres" className="text-primary hover:underline">wakeboard</Link>, garantissant que votre stage ne connaît aucun jour perdu. C'est la promesse de notre <Link to="/stage-kitesurf-100-glisse-hyeres" className="text-primary hover:underline">stage 100% Glisse</Link>.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Un panel complet de disciplines de glisse</h3>
                  <p>
                    KiteSurf Passion est bien plus qu'une simple école de kitesurf. Nous proposons un <strong>éventail complet de sports de glisse nautique</strong> pour satisfaire toutes les envies et s'adapter à toutes les conditions météo sur le spot d'Hyères.
                  </p>
                  <p>
                    Le <Link to="/cours-kitesurf-hyeres-debutant" className="text-primary hover:underline"><strong>kitesurf</strong></Link> reste notre discipline phare, avec des formules allant du stage intensif 5 jours aux <Link to="/cours-particulier-kitesurf-hyeres" className="text-primary hover:underline">cours particuliers</Link> sur mesure. Le <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary hover:underline"><strong>wingfoil</strong></Link>, sport tendance en pleine explosion, offre des sensations de vol uniques et se pratique avec moins de vent que le kitesurf.
                  </p>
                  <p>
                    Le <Link to="/cours-pumpfoil-dock-start-hyeres" className="text-primary hover:underline"><strong>pumpfoil</strong></Link> est notre dernière innovation : volez sur l'eau sans vent ni vagues grâce à la technique du dock start. C'est l'activité idéale les jours calmes et un excellent workout. Le <Link to="/foil-tracte-hyeres" className="text-primary hover:underline"><strong>foil tracté</strong></Link> sert de tremplin vers le wingfoil, tandis que le <Link to="/wakeboard-hyeres" className="text-primary hover:underline"><strong>wakeboard</strong></Link> propose une glisse fun accessible dès 8 ans.
                  </p>
                  <p>
                    Cette diversité fait de KiteSurf Passion <strong>l'école la plus complète du littoral varois</strong>. Quelle que soit votre envie, votre niveau ou les conditions du jour, nous avons toujours une activité à vous proposer. Consultez nos <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary hover:underline">tarifs</Link> ou <Link to="/contact-reservation-kitesurf-hyeres" className="text-primary hover:underline">contactez-nous</Link> pour trouver la formule idéale.
                  </p>
                </div>
              </div>

          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
