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
                  <h3 className="font-display text-2xl font-bold text-foreground">Apprendre le kitesurf sur le spot de l'Almanarre</h3>
                  <p>
                    La <strong>plage de l'Almanarre</strong> se situe à Hyères, sur la presqu'île de Giens. <strong>KiteSurf Passion enseigne le kitesurf depuis 1999</strong> et adapte les séances au niveau des élèves et aux conditions observées sur le spot.
                  </p>
                  <p>
                    Le <strong>Mistral (nord-ouest)</strong> et le <strong>Levant (est)</strong> font partie des vents rencontrés autour de la presqu'île. Leur direction, leur force et l'état de la mer déterminent le lieu de pratique retenu par le moniteur. Les conditions sont vérifiées avant chaque séance.
                  </p>
                  <p>
                    Les séances de KiteSurf Passion sont accompagnées par un <strong>bateau d'assistance</strong>. Il permet au moniteur de suivre les élèves sur l'eau et d'intervenir en cas de difficulté. La pratique reste soumise aux conditions météo et aux consignes de sécurité.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Une pédagogie développée depuis 1999</h3>
                  <p>
                    Notre fondateur <strong>Yoanne Cros</strong> enseigne depuis 1999, est <strong>diplômé d'État (BPJEPS) depuis 2001</strong> et formateur de moniteurs depuis 2010. Son travail auprès des élèves et des moniteurs en formation nourrit la pédagogie de l'école.
                  </p>
                  <p>
                    Avec plus de <strong>2 500 élèves formés</strong>, notre approche associe <strong>bateau d'assistance et radios de communication</strong>, <strong>groupes limités à 4 élèves</strong> et matériel adapté à la séance. Les exercices sont ajustés à votre niveau et à votre progression.
                  </p>
                  <p>
                    Chaque élève bénéficie d'un <strong>suivi individualisé</strong>, avec des débriefings après les séances et des conseils adaptés aux points à travailler. Les groupes limités à quatre élèves permettent au moniteur de proposer des exercices en fonction des acquis de chacun.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Le bateau d'assistance : suivi et récupération sur l'eau</h3>
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
                    KiteSurf Passion propose <strong>le kitesurf, le wingfoil, le pumpfoil, le foil tracté et le wakeboard</strong>. Le choix de l'activité dépend de votre niveau, de vos envies et des conditions du jour. Consultez nos <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary hover:underline">tarifs</Link> ou <Link to="/contact-reservation-kitesurf-hyeres" className="text-primary hover:underline">contactez-nous</Link> pour trouver la formule idéale.
                  </p>
                </div>
              </div>

          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
