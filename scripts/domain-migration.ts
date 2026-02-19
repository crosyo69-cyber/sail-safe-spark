/**
 * Script de Migration de Domaine SEO
 * ===================================
 * 
 * Ce script automatise la migration des références de domaine dans tout le projet.
 * Il couvre TOUS les fichiers contenant des URLs du domaine : pages, composants,
 * fichiers SEO, métadonnées et données structurées JSON-LD.
 * 
 * UTILISATION:
 * 1. Exécuter: npx ts-node scripts/domain-migration.ts --dry-run (pour tester)
 * 2. Vérifier le rapport de simulation
 * 3. Exécuter: npx ts-node scripts/domain-migration.ts (pour appliquer)
 * 
 * COUVERTURE COMPLÈTE:
 * - index.html (métadonnées, Open Graph, JSON-LD, canonical)
 * - src/pages/*.tsx (canonical, hreflang, JSON-LD, Open Graph)
 * - src/components/ (SEORedirect, TestimonialsSection, JSON-LD)
 * - src/lib/ (seo-ratings.ts - données structurées)
 * - public/sitemap.xml (toutes les <loc>)
 * - public/robots.txt (Sitemap directive)
 * - public/rss.xml (liens, guid, atom:link)
 * - public/.well-known/security.txt
 * - public/humans.txt
 * - public/llms.txt
 * 
 * DATE DE MIGRATION PRÉVUE: 25 février 2026
 * 
 * @author KiteSurf Passion
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION - MODIFIER CES VALEURS
// ============================================
const OLD_DOMAIN = 'kitesurfpassion.com';
const NEW_DOMAIN = 'kitesurfpassion.fr';

// Patterns de remplacement (du plus spécifique au moins spécifique)
const REPLACEMENTS = [
  { from: `https://www.${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `https://${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `http://www.${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `http://${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `www.${OLD_DOMAIN}`, to: `www.${NEW_DOMAIN}` },
  // URLs sans www ni protocole (llms.txt, humans.txt, security.txt)
  { from: `${OLD_DOMAIN}/`, to: `${NEW_DOMAIN}/` },
  { from: `${OLD_DOMAIN}"`, to: `${NEW_DOMAIN}"` },
];

// Fichiers et répertoires à scanner
const TARGET_PATHS = [
  // Fichier racine
  'index.html',
  // Code source React
  'src/pages',
  'src/components',
  'src/lib',
  // Fichiers SEO publics
  'public/sitemap.xml',
  'public/robots.txt',
  'public/rss.xml',
  'public/.well-known/security.txt',
  'public/humans.txt',
  'public/llms.txt',
];

// Extensions de fichiers à traiter
const FILE_EXTENSIONS = ['.tsx', '.ts', '.html', '.xml', '.txt'];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

interface MigrationResult {
  file: string;
  replacements: number;
  changes: string[];
}

interface MigrationSummary {
  totalFiles: number;
  modifiedFiles: number;
  totalReplacements: number;
  results: MigrationResult[];
  skippedFiles: string[];
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
    console.warn(`  ⚠️  Chemin introuvable: ${dirPath}`);
    return arrayOfFiles;
  }

  const stat = fs.statSync(dirPath);
  
  if (stat.isFile()) {
    const ext = path.extname(dirPath);
    if (FILE_EXTENSIONS.includes(ext)) {
      arrayOfFiles.push(dirPath);
    }
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileStat = fs.statSync(filePath);
    
    if (fileStat.isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (FILE_EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function migrateFile(filePath: string, dryRun: boolean): MigrationResult | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let totalReplacements = 0;
  const changes: string[] = [];

  for (const { from, to } of REPLACEMENTS) {
    const regex = new RegExp(escapeRegExp(from), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      const count = matches.length;
      totalReplacements += count;
      changes.push(`"${from}" → "${to}" (${count}x)`);
      content = content.replace(regex, to);
    }
  }

  if (totalReplacements > 0) {
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    return {
      file: filePath,
      replacements: totalReplacements,
      changes,
    };
  }

  return null;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// VALIDATION POST-MIGRATION
// ============================================

function validateMigration(): string[] {
  const errors: string[] = [];
  
  // Vérifier qu'aucune référence à l'ancien domaine ne subsiste
  const allFiles: string[] = [];
  for (const targetPath of TARGET_PATHS) {
    getAllFiles(targetPath, allFiles);
  }

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const oldDomainRegex = new RegExp(escapeRegExp(OLD_DOMAIN), 'g');
    const matches = content.match(oldDomainRegex);
    if (matches) {
      errors.push(`❌ ${file}: ${matches.length} référence(s) restante(s) à "${OLD_DOMAIN}"`);
    }
  }

  return errors;
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

function runMigration(dryRun: boolean = false): void {
  console.log('\n' + '═'.repeat(70));
  console.log('  🚀 SCRIPT DE MIGRATION DE DOMAINE SEO v2.0');
  console.log('  📅 Migration prévue: 25 février 2026');
  console.log('═'.repeat(70));
  console.log(`\n  📋 Configuration:`);
  console.log(`     Ancien domaine : ${OLD_DOMAIN}`);
  console.log(`     Nouveau domaine: ${NEW_DOMAIN}`);
  console.log(`     Mode           : ${dryRun ? '🔍 DRY-RUN (simulation)' : '⚡ EXÉCUTION RÉELLE'}`);
  console.log('\n' + '─'.repeat(70));

  // Collecter tous les fichiers
  let allFiles: string[] = [];
  for (const targetPath of TARGET_PATHS) {
    allFiles = getAllFiles(targetPath, allFiles);
  }

  console.log(`\n  📁 Fichiers analysés: ${allFiles.length}`);

  // Exécuter la migration
  const results: MigrationResult[] = [];
  let totalReplacements = 0;
  const skippedFiles: string[] = [];

  for (const file of allFiles) {
    const result = migrateFile(file, dryRun);
    if (result) {
      results.push(result);
      totalReplacements += result.replacements;
    } else {
      skippedFiles.push(file);
    }
  }

  // Afficher les résultats
  console.log('\n' + '─'.repeat(70));
  console.log('  📊 RÉSULTATS DE LA MIGRATION');
  console.log('─'.repeat(70));

  if (results.length === 0) {
    console.log('\n  ✅ Aucune occurrence trouvée. Le domaine est déjà à jour.');
  } else {
    console.log(`\n  📝 Fichiers modifiés : ${results.length}/${allFiles.length}`);
    console.log(`  🔄 Total remplacements: ${totalReplacements}`);
    console.log('\n  📄 Détail par fichier:\n');

    // Grouper par catégorie
    const categories: Record<string, MigrationResult[]> = {
      'HTML / Métadonnées': [],
      'Pages React': [],
      'Composants React': [],
      'Bibliothèques': [],
      'Fichiers SEO publics': [],
    };

    for (const result of results) {
      if (result.file === 'index.html') {
        categories['HTML / Métadonnées'].push(result);
      } else if (result.file.startsWith('src/pages')) {
        categories['Pages React'].push(result);
      } else if (result.file.startsWith('src/components')) {
        categories['Composants React'].push(result);
      } else if (result.file.startsWith('src/lib')) {
        categories['Bibliothèques'].push(result);
      } else {
        categories['Fichiers SEO publics'].push(result);
      }
    }

    for (const [category, categoryResults] of Object.entries(categories)) {
      if (categoryResults.length > 0) {
        console.log(`     ── ${category} ──`);
        for (const result of categoryResults) {
          console.log(`     📁 ${result.file} (${result.replacements} remplacement${result.replacements > 1 ? 's' : ''})`);
          for (const change of result.changes) {
            console.log(`        • ${change}`);
          }
        }
        console.log('');
      }
    }
  }

  // Validation post-migration (uniquement en mode réel)
  if (!dryRun && results.length > 0) {
    console.log('─'.repeat(70));
    console.log('  🔍 VALIDATION POST-MIGRATION');
    console.log('─'.repeat(70));
    
    const errors = validateMigration();
    if (errors.length === 0) {
      console.log('\n  ✅ Aucune référence résiduelle à l\'ancien domaine détectée.');
    } else {
      console.log(`\n  ⚠️  ${errors.length} problème(s) détecté(s):`);
      for (const error of errors) {
        console.log(`     ${error}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(70));
  
  if (dryRun && results.length > 0) {
    console.log('  ⚠️  MODE DRY-RUN: Aucune modification n\'a été effectuée.');
    console.log('  Pour appliquer: npx ts-node scripts/domain-migration.ts');
  } else if (!dryRun && results.length > 0) {
    console.log('  ✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════════════════╗');
    console.log('  ║           CHECKLIST POST-MIGRATION (25 FÉV 2026)           ║');
    console.log('  ╠══════════════════════════════════════════════════════════════╣');
    console.log('  ║                                                            ║');
    console.log('  ║  PHASE 1 — Déploiement (Jour J)                            ║');
    console.log('  ║  □ 1. Publier le site sur Lovable                          ║');
    console.log('  ║  □ 2. Configurer le domaine .com dans Lovable (Settings)   ║');
    console.log('  ║  □ 3. Ajouter les enregistrements DNS chez IONOS           ║');
    console.log('  ║       A @ → 185.158.133.1                                  ║');
    console.log('  ║       A www → 185.158.133.1                                ║');
    console.log('  ║       TXT _lovable → lovable_verify=...                    ║');
    console.log('  ║  □ 4. Vérifier SSL actif sur https://www.kitesurfpassion.com ║');
    console.log('  ║                                                            ║');
    console.log('  ║  PHASE 2 — Redirections .fr → .com (IONOS)                 ║');
    console.log('  ║  □ 5. Configurer la redirection 301 du .fr vers le .com    ║');
    console.log('  ║       kitesurfpassion.fr → https://www.kitesurfpassion.com ║');
    console.log('  ║       www.kitesurfpassion.fr → https://www.kitesurfpassion.com ║');
    console.log('  ║  □ 6. Tester les redirections (curl -I)                    ║');
    console.log('  ║                                                            ║');
    console.log('  ║  PHASE 3 — Google Search Console                           ║');
    console.log('  ║  □ 7. Ajouter la propriété kitesurfpassion.com dans GSC    ║');
    console.log('  ║  □ 8. Soumettre le nouveau sitemap.xml                     ║');
    console.log('  ║  □ 9. Demande de changement d\'adresse (GSC .fr → .com)     ║');
    console.log('  ║  □ 10. Demander l\'indexation des pages prioritaires        ║');
    console.log('  ║                                                            ║');
    console.log('  ║  PHASE 4 — Vérifications                                  ║');
    console.log('  ║  □ 11. Tester Open Graph: developers.facebook.com/tools/debug ║');
    console.log('  ║  □ 12. Valider JSON-LD: search.google.com/test/rich-results ║');
    console.log('  ║  □ 13. Vérifier les balises canonical (toutes en .com)     ║');
    console.log('  ║  □ 14. Tester les 100+ redirections _redirects             ║');
    console.log('  ║  □ 15. Vérifier Google My Business (URL du site)           ║');
    console.log('  ║                                                            ║');
    console.log('  ║  PHASE 5 — Suivi (J+7 à J+30)                             ║');
    console.log('  ║  □ 16. Monitorer GSC pour erreurs de couverture            ║');
    console.log('  ║  □ 17. Vérifier que les redirections 301 sont actives      ║');
    console.log('  ║  □ 18. Maintenir le .fr actif pendant 12 mois minimum     ║');
    console.log('  ║                                                            ║');
    console.log('  ╚══════════════════════════════════════════════════════════════╝');
  }
  
  console.log('═'.repeat(70) + '\n');
}

// ============================================
// POINT D'ENTRÉE
// ============================================

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

runMigration(isDryRun);
