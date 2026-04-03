/**
 * Legacy URL → New URL redirect mapping.
 * Extracted from public/_redirects for client-side 301 handling via React Router.
 * Covers: .html pages, details-* articles, -zNN SEO local pages, partner pages, and misc redirects.
 */

// Exact path matches: old path → new path
export const exactRedirects: Record<string, string> = {
  // 1. Pages principales (.html)
  "/nos-activites": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/nos-activites.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-kite-surf-w1": "/cours-kitesurf-hyeres-debutant",
  "/activites-kite-surf-w1.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-wing-foil-w1": "/stage-wingfoil-hyeres-almanarre",
  "/activites-wing-foil-w1.html": "/stage-wingfoil-hyeres-almanarre",
  "/pump-foil-dock-start-w1": "/cours-pumpfoil-dock-start-hyeres",
  "/pump-foil-dock-start-w1.html": "/cours-pumpfoil-dock-start-hyeres",
  "/activites-downwind-foil-w1": "/cours-pumpfoil-dock-start-hyeres",
  "/activites-downwind-foil-w1.html": "/cours-pumpfoil-dock-start-hyeres",
  "/bons-cadeaux-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/bons-cadeaux-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-w1": "/a-propos-ecole-kitesurf-hyeres",
  "/guide-local-w1.html": "/a-propos-ecole-kitesurf-hyeres",
  "/tarifs.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/contact.html": "/contact-reservation-kitesurf-hyeres",
  "/mentions-legales.html": "/mentions-legales",
  "/politique-confidentialite.html": "/politique-confidentialite",
  "/plan-du-site": "/",
  "/plan-du-site.html": "/",
  "/index.html": "/",
  "/toutes-nos-prestations-1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/toutes-nos-prestations-1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/archives-1": "/blog-kitesurf-hyeres",
  "/archives-1.html": "/blog-kitesurf-hyeres",
  "/secteurs": "/spot-kitesurf-almanarre-hyeres-var",
  "/secteurs.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/contact-w1": "/contact-reservation-kitesurf-hyeres",
  "/contact-w1.html": "/contact-reservation-kitesurf-hyeres",
  "/spot-almanarre-w1": "/spot-kitesurf-almanarre-hyeres-var",
  "/spot-almanarre-w1.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/tarifs-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/tarifs-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",

  // 2. Articles & Pages détail (details-*.html)
  "/details-apprendre+le+kitesurf+en+ecole+a+hyeres+dans+le+var-147.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+cours+pour+apprendre+ou+a+se+perfectionner+en+kitesurf+a+hyeres+dans+le+var-35.html": "/session-kitesurf-carte-hyeres",
  "/details-stages+et+cours+de+perfectionnement+ou+coaching+en+kitesurf+a+hyeres+a+proximite+de+carqueiranne-152.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-apprenez+le+kitesurf+avec+le+bon+materiel+a+hyeres-250.html": "/blog/guide-equipement-kitesurf-debutant",
  "/details-kitesurf+enfant+et+adolescent+a+hyeres+apprendre+en+toute+securite-214.html": "/cours-kitesurf-hyeres-debutant",
  "/details-stage+de+kitesurf+a+l+almanarre+5+jours+pour+progresser+rapidement+a+hyeres-224.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-pratiquez+le+kitesurf+a+l+almanarre+en+toute+securite-219.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-conditions+de+vent+a+l+almanarre+le+guide+kitesurf+a+hyeres-211.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-stage+de+perfectionnement+kitesurf+avance+a+hyeres-215.html": "/session-kitesurf-carte-hyeres",
  "/details-organisez+votre+sejour+kitesurf+a+hyeres+avec+kitesurf+passion-217.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-wingfoil+debutant+a+hyeres+apprenez+a+voler+sur+l+eau+a+l+almanarre-247.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-offrir+un+stage+d+initiation+de+wing+foil+sur+5+jours+consecutifs-130.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-offrir+une+cours+de+wingfoil+avec+kite+surf+passion-131.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-ecole+de+wing+foil+hyeres+proche+l+almanare-184.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-pourquoi+se+mettre+au+wing+foil+sur+hyeres+almanare-158.html": "/blog/wingfoil-sport-tendance-2024",
  "/details-ecole+de+wingfoil+a+hyeres+apprenez+le+wingfoil+a+l+almanarre+dans+le+var-227.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-est-il+dangereux+d+apprendre+le+wingfoil+a+hyeres+dans+le+var-182.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-cours+de+foil+pour+le+kitesurf+et+le+wing+foil+et+le+surf+foil+hyeres+83+dans+le+var-22.html": "/foil-tracte-hyeres",
  "/details-nouveaute+a+hyeres+decouvrez+notre+simulateur+de+foil+tracte+wingfoil+surf+foil+kite+foil+windsurf+foil-190.html": "/foil-tracte-hyeres",
  "/details-tarifs+des+cours+de+kitesurf+a+hyeres+formules+claires+et+adaptees-245.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-spot+de+kitesurf+de+la+baie+de+l+almanarre+un+lieu+mythique+a+hyeres-243.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-la+meteo+du+vent+sur+hyeres+l+almanarre+pour+ne+pas+rater+vos+sessions+de+kitesurf-51.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-moniteur+de+kitesurf+diplome+a+hyeres+un+encadrement+professionnel+et+securise-242.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-moniteur+de+kitesurf+diplome+a+hyeres+un+encadrement+professionnel+et+securise-204.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-bon+cadeaux+fete+de+noel+pour+ecole+de+kite+surf+hyeres-165.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-commandez+votre+bon+cadeau+kitesurf+dans+le+var-246.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-commandez+votre+bon+cadeau+kitesurf+des+maintenant-208.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",

  // 3. Sous-pages activités & pages supplémentaires
  "/activites-coaching+wingfoil+hyeres+de+l+almanarre-26.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/actualit-s-w1.html": "/blog-kitesurf-hyeres",
  "/archives-2.html": "/blog-kitesurf-hyeres",
  "/archives-3.html": "/blog-kitesurf-hyeres",
  "/archives-4.html": "/blog-kitesurf-hyeres",

  // 4. Pages villes (SEO local)
  "/hyeres-y1": "/",
  "/presqu+ile+de+giens-y2": "/spot-kitesurf-almanarre-hyeres-var",
  "/toulon-y3": "/",

  // 8. Pages partenaires (lien-*.html)
  "/lien-federation+de+vol+libre+nice+ffvl-25.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-agence+immobilier+carqueiranne+guyhoquet-58.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-hotel+carqueiranne+hotel+richiardi-31.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-office+du+tourisme+toulon+provence+med-191.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-salle+de+sports+hyeres+synergy+fit-170.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-tilou+location+specialiste+de+la+location+d+appartements+et+chambre+d+hote+a+giens+hyeres+giens+tiloulocation-54.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-simulateur+de+chute+libre+hyrese+air+vertical-44.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-location+de+villa+et+maison+hyeres+giens+s-lux-37.html": "/a-propos-ecole-kitesurf-hyeres",

  // 13. URLs GSC mars 2026 - variantes avec espaces (normalisées en +)
  "/details-les+spots+de+kitesurf+de+la+baie+de+l+almanarre+et+de+hyeres-23.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-le+stage+d+initiation+kitesurf+100+glisse+a+hyeres+dans+le+var+83-36.html": "/stage-kitesurf-100-glisse-hyeres",

  // 9. URLs 404 détectées dans GSC (février 2026)
  "/details-venez+apprendre+le+wing+foil+en+stage+et+cours+d+initiation+hyeres+l+almanarre-70.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-venez+apprendre+le+wing+foil+en+stage+et+cours+d+initiation+a+hyeres+l+almanarre-70.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-cours+de+pump+foil+et+dock+start+a+hyeres+plage+de+l+almanare+var-37.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-ailes+d+occasion+de+kitesurf+a+vendre+duotone+a+hyeres+l+amanarre-151.html": "/location-materiel-kitesurf-hyeres",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres+-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-stage+et+cours+d+initiation+et+perfectionnement+au+kitesurf-hyeres+carqueiranne+giens-16.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-stage+et+cours+d+initiation+et+perfectionnement+au+kitesurf+hyeres+carqueiranne+giens-16.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-ecole+de+kitesurf+pour+des+cours+debutant+et+perfectionnement+hyeres+carqueiranne-3.html": "/cours-kitesurf-hyeres-debutant",
  "/cours-et-stages-2.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres--24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+ou+un+enfant+de+plus+35+kilos+un+bon+cadeaux+pour+le+kitesurf+a+hyeres+dans+le+83-63.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-la+m+t+o+du+vent+sur+hyeres+l+almanarre+pour+ne+pas+rater+vos+sessions+de+kitesurf-51.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/bons-cadeaux-w0.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-kitesurf+passion+price+list+2019+introduction+progression+courses+at+hyeres-69.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/lien-sophrologue+toulon+veronique+barreault-50.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-est-il+dangereux+d+apprendre+le+kitesurf+a+hyeres+dans+le+var-179.html": "/cours-kitesurf-hyeres-debutant",
  "/details-l+ecole+kitesurf+passion+vous+propose+2+formules+d+apprentissage+soit+en+stage+d+initiation+ou+cours+de+perfectionnement+en+kite+sur+5+jours+consecutifs+soit+en+discontinue+a+hyeres+l+almanarre-59.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-comment+apprendre+le+kitesurf+hyeres+carqueiranne-23.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+cours+de+kitesurf+a+hyeres+carqueiranne-35.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+cours+pour+apprendre+ou+se+perfectionner+kitesurf+hyeres+carqueiranne-35.html": "/session-kitesurf-carte-hyeres",
  "/details-les+forfaits+de+kitesurf+passion+hyeres+carqueiranne-35.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-offrir+un+cours+particulier+kitesurf+avec+kitesurf+passion+une+ecole+proche+de+vous-128.html": "/cours-particulier-kitesurf-hyeres",
  "/details-les+stages+d+initiation+au+kitesurf+pour+les+debutants+a+hyeres+83+dans+le+var-41.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-prendre+des+cours+de+kitesurf+a+hyeres+l+almanarre+-29.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-trouver+une+ecole+de+kitesurf-hyeres+carqueiranne-22.html": "/cours-kitesurf-hyeres-debutant",

  // 11. URLs "Détectée, non indexée" GSC (mars 2026)
  "/activites-acheter+une+aile+d+occasion+de+kitesurf+hyeres+proche+carqueiranne+var-19.html": "/location-materiel-kitesurf-hyeres",
  "/activites-apprendre+le+waterstart+en+kitesurf+-30.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-comment+apprendre+le+kitesurf+avec+un+prof+a+hyeres+proche+de+carqueiranne+var-23.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-comment+demarrer+la+wingfoil+avec+un+cours+d+initiation+hyeres+les+palmiers+proche+plage+de+l+almanare-32.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-comment+demarrer+le+kitesurf+en+cours+a+hyeres+plage+de+l+almanare+var-31.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-prendre+des+cours+de+kitesurf+a+hyeres+plage+de+l+almanarre+-29.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-simulateur+de+foil+pour+le+surf+foil+kite+foil+wingfoil+windsurfoil+hyeres+carquieranne+l+almanarreeres+carquieranne+l+almanarre-36.html": "/foil-tracte-hyeres",
  "/activites-stage+de+kite+surf+pour+2+heures+et+deux+personnes+hyeres+proche+de+la+giens+var-40.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-stage+de+kitesurf+avec+un+prof+diplome+hyeres+proche+de+la+presqu+iles+de+giens+dans+le+var-38.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-stage+de+kitesurf+pour+debutant+hyeres+proche+giens+var-39.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-trouver+une+ecole+de+kitesurf+pour+faire+un+cours+d+initiation+hyeres+proche+de+carqueiranne-22.html": "/cours-kitesurf-hyeres-debutant",
  "/details-apprendre+le+kitesurf+avec+bateau+d+assistance+a+hyeres-241.html": "/cours-kitesurf-hyeres-debutant",
  "/details-apprendre+le+kitesurf+avec+bateau+d+assistance+securite+et+progression-203.html": "/cours-kitesurf-hyeres-debutant",
  "/details-bon+cadeau+pour+stage+de+wing+foil+a+hyeres+proche+toulon+dans+le+var-195.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-cours+de+kitesurf+debutant+a+hyeres+apprenez+en+toute+securite+a+l+almanarre-220.html": "/cours-kitesurf-hyeres-debutant",
  "/details-cours+de+kitesurf+debutant+a+hyeres+apprenez+en+toute+securite-196.html": "/cours-kitesurf-hyeres-debutant",
  "/details-cours+de+kitesurf+et+de+wingfoil+a+hyeres+et+carqueiranne+avec+casques+radio-186.html": "/cours-kitesurf-hyeres-debutant",
  "/details-cours+de+pumpfoil+et+dock+start+a+hyeres+apprenez+le+foil+autrement-201.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-ecole+de+wingfoil+a+hyeres+apprenez+le+wingfoil+en+toute+securite-198.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-frederic+h-156.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-kitesurf+a+toulon+une+ecole+de+reference+a+proximite-239.html": "/cours-kitesurf-hyeres-debutant",
  "/details-kitesurf+a+toulon+votre+ecole+de+kitesurf+a+proximite-202.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+occasions+en+vente+de+materiel+de+l+ecole+kitesurf+passion+a+hyeres-45.html": "/location-materiel-kitesurf-hyeres",
  "/details-location+de+materiel+de+kitesurf+a+carqueiranne+materiel+recent+et+performant-200.html": "/location-materiel-kitesurf-hyeres",
  "/details-materiel+de+kitesurf+debutant+le+guide+complet+pour+bien+commencer-212.html": "/blog/guide-equipement-kitesurf-debutant",
  "/details-offrir+un+stage+100+glisse+kite+surf-127.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-le+stage+100+glisse+kitesurf+a+l+almanarre-143.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-reservez+votre+cours+de+pumpfoil+a+hyeres-240.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-reservez+votre+location+de+materiel+de+kitesurf+a+carqueiranne-230.html": "/location-materiel-kitesurf-hyeres",
  "/details-rogression+en+kitesurf+combien+de+seances+pour+devenir+autonome-213.html": "/cours-kitesurf-hyeres-debutant",
  "/details-simulateur+de+foil+a+hyeres+wingfoil+kite+foil+windsurf+foil+et+surf+foil-189.html": "/foil-tracte-hyeres",
  "/details-stage+de+kitesurf+a+l+almanarre+5+jours+pour+devenir+autonome-197.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-tarifs+des+cours+de+kitesurf+a+hyeres+des+formules+claires+et+transparentes-207.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-trouver+une+ecole+de+wing+foil+a+hyeres+dans+le+var-148.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-wingfoil+debutant+a+hyeres+apprenez+en+toute+securite+a+l+almanarre-209.html": "/stage-wingfoil-hyeres-almanarre",
  "/lien-annuaire+generaliste+d+entreprises+et+de+services+marseille+provence+jalis-2.html": "/a-propos-ecole-kitesurf-hyeres",
  "/pump-foil-dock-start-w0.html": "/cours-pumpfoil-dock-start-hyeres",
  "/activites-apprendre+le+kitesurf+rapidement+quand+on+est+debutant+hyeres+de+l+almanarre-11.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-ou+faire+du+kitesurf+dans+le+var+hyeres-18.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres\u201324.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-w2.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-les+spot+de+kitesurf+de+hyeres+et+la+baie+de+l+almanarre+et+de+giens-23.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/archives-0.html": "/blog-kitesurf-hyeres",
  "/activites-w0.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-w0.html": "/a-propos-ecole-kitesurf-hyeres",

  // 14. URLs 404 GSC mars 2026 (batch 2)
  "/activites-w2.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-2.html": "/a-propos-ecole-kitesurf-hyeres",
  "/nos-activites-activites.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-stages+et+cours+de+kitesurf+pour+les+familles+et+adolescents+a+hyeres+et+carqueiranne-168.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-apprendre+les+bases+du+kitesurf+quand+on+est+debutant+hyeres-17.html": "/cours-kitesurf-hyeres-debutant",
  "/lien-locations+bateaux+hyeres+route+du+sud-43.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-locations+bateaux+hyeres+route+du+sud-43.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-chloe+susanj+professeur+de+yoga+et+de+fitness+vous+propose+des+cours+pour+votre+bien-etre-52.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-gaspard+chr-155.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-raids+en+kitesurf+a+porquerolles+dans+le+var-21.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-les+tarifs+de+cours+et+de+stage+ou+cours+particulier+de+kitesurf+hyeres+carqueiranne-12.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-comment+demarrer+la+wingfoil-32.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-apprendre+le+wing+foil+en+stage+ou+cours+d+initiation+toulon+proche+de+hyeres-25.html": "/stage-wingfoil-hyeres-almanarre",

  // 15. URLs "Page avec redirection" GSC mars 2026
  "/boncadeau.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/cours-et-stages-0.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-le-shop-w1.html": "/location-materiel-kitesurf-hyeres",
  "/guide-local-1.html": "/a-propos-ecole-kitesurf-hyeres",
  "/activites-apprendre+le+wing+foil+en+stage+d+initiation+toulon-25.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-apprendre+le+wing+foil+en+stage+d+initiation--25.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-prendre+des+cours+de+kitesurf+a+hyeres+l+almanarre-29.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-balade+en+paddle+giens+porquerolles-10.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-raids+en+kitesurf+porquerolles-11.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-ecole+de+kitesurf+pour+des+cours+debutant+et+perfectionnement-hyeres+carqueiranne-3.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-coaching+pour+2+personnes+en+wing+foil-hyeres-27.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-coaching+pour+2+personnes+en+wing+foil+hyeres-27.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-coaching+pour+2+personnes+en+wing+foil-27.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-ou+faire+du+kitesurf+dans+le+var-hyeres-18.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/activites-comment+demarrer+la+wingfoil--32.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-comment+demarrer+la+wingfoil+-32.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-comment+demarrer+le+kitesurf+-31.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-apprendre+les+bases+du+kitesurf+quand+on+est+debutant-hyeres-17.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-apprendre+dans+une+ecole+pour+des+cours+de+kitesurf-carqueiranne+hyeres-2.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-apprendre+le+kitesurf+un+sport+extreme+hyeres-17.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-les+spots+de+kitesurf+pour+prendre+des+lecons+et+des+cours-hyeres+giens-8.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/activites-location+de+kitesurf-hyeres+l+almanarre-14.html": "/location-materiel-kitesurf-hyeres",
  "/activites-acheter+une+aile+d+occasion+de+kitesurf-hyeres+carquieranne-19.html": "/location-materiel-kitesurf-hyeres",
  "/activites-acheter+une+aile+d+occasion+de+kitesurf+hyeres+carquieranne-19.html": "/location-materiel-kitesurf-hyeres",
  "/details-le+stage+d+initiation+kitesurf+100+glisse+a+hyeres+carqueiranne+var+83-36.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-le+stage+100+glisse+de+kitesurf+passion+hyeres+carqueiranne-36.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-offrir+un+stage+d+initiation+de+wing+foil+sur+5+jours+consecutifs+avec+kitesurf+passion+une+ecole+proche+de+vous-130.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-les+ballades+en+paddle+autour+de+la+presqu+ile+de+giens+et+de+porquerolles-19.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-cours+de+foil+pour+le+kitesurf+et+le+surf+hyeres+carqueiranne-22.html": "/foil-tracte-hyeres",
  "/details-cours+de+foil+pour+le+kitesurf+et+le+surf+hyeres+83+dans+le+var-22.html": "/foil-tracte-hyeres",
  "/details-cours+de+foil+pour+le+kitesurf+et+le+surf-22.html": "/foil-tracte-hyeres",
  "/details-les+tarifs+de+kitesurf+passion-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-les+tarifs+du+kitesurf-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-les+tarifs+pour+les+stages+et+les+cours+d+initiation+du+kitesurf+a+hyeres+carqueiranne-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-magasin+de+surf+shop+hyeres+welcome-20.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-les+raids+a+porquerolles+en+kitesurf-21.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+raids+a+porquerolles+en+kitesurf+autour+de+giens-21.html": "/cours-kitesurf-hyeres-debutant",
  "/details-la+planche+tractee+wakeboard+a+hyeres+carqueiranne-38.html": "/wakeboard-hyeres",
  "/details-wingfoil+a+hyeres-163.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-les+aperos+paddle+au+coucher+de+soleil+a+hyeres-33.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-foot+en+salle+carnoux+le+temple+du+soccer-47.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-prendre+une+lecon+pour+apprendre+le+kitesurf+dans+une+ecole+a+hyeres+carqueiranne-49.html": "/cours-kitesurf-hyeres-debutant",
  "/details-le+kitesurf+un+sport+de+l+extreme+ou+un+sport+facile+a+apprendre+a+hyeres+carqueiranne-48.html": "/cours-kitesurf-hyeres-debutant",
  "/details-yoga+fitness+hyeres+chloe+susanj-fit+n+yoga-67.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-communication+hyeres+ourson-42.html": "/a-propos-ecole-kitesurf-hyeres",

  // 16. URLs GSC mars 2026 - nouvelles captures
  "/six-fours-les-plages-y4": "/",
  "/activites-downwind-foil-w0.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-la+m+t+o+du+vent+sur+hy+res+l+almanarre+pour+ne+pas+rater+vos+sessions+de+kitesurf-51.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-acheter+une+aile+de+kitesurf+d+occasion+avec+l+ecole+de+kitesurf+a+hyeres+carqueiranne-55.html": "/location-materiel-kitesurf-hyeres",
  "/activites-acheter+une+aile+d+occasion+de+kitesurf+hyeres+carqueiranne-19.html": "/location-materiel-kitesurf-hyeres",
  "/activites-acheter+une+aile+d+occasion+de+kitesurf+hyeres+carqueiranne-19.htm": "/location-materiel-kitesurf-hyeres",
  "/details-speed+cart+hyeres+speed+cart-30.html": "/a-propos-ecole-kitesurf-hyeres",
  "/activites-apprendre+le+wing+foil+en+stage+d+initiation-25.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-apprendre+le+wing+foil+en+stage+d+initiation-toulon-25.html": "/stage-wingfoil-hyeres-almanarre",

  // 18. URLs 404 GSC mars 2026 - batch .com
  "/details-spot+de+kitesurf+de+la+baie+de+l+almanarre+le+joyau+de+hyeres-205.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-faut+l+une+experience+prealable+pour+apprendre+le+kitesurf+a+hyeres-177.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+balades+en+paddle+autour+de+la+presqu+ile+de+giens+et+de+porquerolles-19.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/lien-office+du+tourisme+de+carqueiranne+carqueiranne+office+du+tourime-29.html": "/a-propos-ecole-kitesurf-hyeres",

  // 17. Logs 404 mars 2026 - vague 2
  "/details-cours+de+pump+foil+et+dock+start+a+hyeres+les+palmiers-192.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-stage+initiation+de+pump+foil+a+hyeres+les+palmiers+plage+l+almanarre-194.html": "/cours-pumpfoil-dock-start-hyeres",
  "/location-materiel": "/location-materiel-kitesurf-hyeres",

  // 18. Logs 404 avril 2026 - vague 3
  "/details-les+tarifs+pour+les+stages+et+les+cours+d+initiation+du+kitesurf+a+hyeres-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-apprendre+la+wingfoil+a+hyeres+carqueiranne-164.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-depose+en+mer+sur+le+spot+de+l+almanarre+et+le+spot+de+hyeres-34.html": "/deposes-mer-kitesurf-hyeres",
  "/lien-agence+web+marseille+-+creation+site+internet+-+referencement+marseille+jalis-1.html": "/a-propos-ecole-kitesurf-hyeres",

  // 12. Redirections internes + anciennes URLs courtes crawlées par Google
  "/foil-tracte-wakeboard-hyeres": "/foil-tracte-hyeres",
  "/tarifs": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/foil-tracte": "/foil-tracte-hyeres",
  "/deposes-mer": "/deposes-mer-kitesurf-hyeres",
  "/spot-almanarre": "/spot-kitesurf-almanarre-hyeres-var",
  "/a-propos": "/a-propos-ecole-kitesurf-hyeres",
  "/contact": "/contact-reservation-kitesurf-hyeres",
  "/stage-wingfoil": "/stage-wingfoil-hyeres-almanarre",
  "/cours-pumpfoil": "/cours-pumpfoil-dock-start-hyeres",
  "/blog": "/blog-kitesurf-hyeres",
  "/cours-kitesurf": "/cours-kitesurf-hyeres-debutant",
  "/wakeboard": "/wakeboard-hyeres",
};

/**
 * Pattern-based redirects for SEO local pages (-zNN suffix).
 * Maps keyword patterns to their target URLs.
 * These handle URLs like: /ecole+de+kitesurf+tous+niveaux+toulon-z3
 */
interface PatternRedirect {
  /** Keyword portion before the city name */
  keyword: string;
  target: string;
}

const seoLocalPatterns: PatternRedirect[] = [
  // Kitesurf
  { keyword: "ecole+de+kitesurf+tous+niveaux", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ou+apprendre+le+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "tarifs+des+cours+de+kitesurf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+kite+surf+pour+debutant", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "week-end+decouverte+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "stage+de+kitesurf+a+la+semaine+ou+au+week-end", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+de+perfectionnement+en+kitesurf", target: "/session-kitesurf-carte-hyeres" },
  { keyword: "cours+d+initiation+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prendre+des+cours+en+ecole+de+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ecole+de+kite+surf+pour+cours+individuels+ou+particuliers", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "stage+de+kitesurf+pour+debutant", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+de+kitesurf+prix", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+perfectionnement+en+kite+surf+pour+gagner+en+autonomie", target: "/session-kitesurf-carte-hyeres" },
  { keyword: "organiser+un+sejour+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ecole+de+voile+pour+voyage+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "vente+materiel+de+kitesurf+d+occasion", target: "/location-materiel-kitesurf-hyeres" },

  // Foil Tracté
  { keyword: "cours+de+foil+tracte", target: "/foil-tracte-hyeres" },

  // Wakeboard
  { keyword: "planche+tractee+wakeboard", target: "/wakeboard-hyeres" },
  { keyword: "reservation+de+cours+de+wakeboard", target: "/wakeboard-hyeres" },

  // Location
  { keyword: "acheter+du+materiel+de+kite+surf", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "prix+location+de+materiel+de+kite+surf", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "location+de+materiel+de+kitesurf", target: "/location-materiel-kitesurf-hyeres" },

  // Dépose en mer
  { keyword: "depose+en+mer+pour+kitesurf", target: "/deposes-mer-kitesurf-hyeres" },

  // Wingfoil
  { keyword: "cours+de+wing+foil", target: "/stage-wingfoil-hyeres-almanarre" },
  { keyword: "ecole+avec+cours+et+stages+pour+apprendre+le+wing+foil", target: "/stage-wingfoil-hyeres-almanarre" },
  { keyword: "prix+cours+de+wingfoil", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },

  // Découverte
  { keyword: "journee+decouverte+kite+surf+ou+wing+foil", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },

  // Autres sports / anciennes pages
  { keyword: "cours+de+sky+surf+et+fly+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "faire+une+balade+en+paddle", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "vente+materiel+de+kitesurf+d+occasion", target: "/location-materiel-kitesurf-hyeres" },

  // Nouveaux patterns GSC mars 2026
  { keyword: "acheter+du+materiel+de+kite+surf", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "prix+cours+kitesurf+en+groupe", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+foil+pour+kitesurf", target: "/foil-tracte-hyeres" },
  { keyword: "prix+location+de+materiel+de+kite", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "stage+pour+apprendre+le+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prendre+des+cours+de+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "faire+un+stage+de+kitesurf+a+l+almanarre", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+pour+apprendre+le+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "cours+de+kitesurf+en+groupe", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ou+prendre+des+cours+de+strapless", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prix+stage+d+initiation+kite+surf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "prix+d+un+stage+de+kite+surf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+individuel+kitesurf+prix", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "cours+particulier+de+kitesurf", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "journee+decouverte+du+kitesurf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "journee+decouverte+en+paddle", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
];

/**
 * Resolve a legacy URL path to its new destination.
 * Returns the new path or null if no redirect matches.
 */
export function resolveLegacyRedirect(pathname: string): string | null {
  // Normalize: Google may crawl with %20, spaces, or + signs — decode then unify to +
  const decoded = decodeURIComponent(pathname);
  const normalized = decoded.replace(/ /g, "+");

  // 1. Check exact matches first (try both original and normalized)
  if (exactRedirects[pathname]) {
    return exactRedirects[pathname];
  }
  if (normalized !== pathname && exactRedirects[normalized]) {
    return exactRedirects[normalized];
  }

  // 2. Check dossier_cite/* (old CMS images)
  if (pathname.startsWith("/dossier_cite/")) {
    return "/placeholder.svg";
  }

  // 3. Check SEO local patterns (keyword+city-zNN)
  const zSuffixMatch = normalized.match(/-z\d+$/);
  if (zSuffixMatch) {
    const pathWithoutSuffix = normalized.slice(0, zSuffixMatch.index);
    for (const pattern of seoLocalPatterns) {
      if (pathWithoutSuffix.startsWith("/" + pattern.keyword)) {
        return pattern.target;
      }
    }
  }

  return null;
}
