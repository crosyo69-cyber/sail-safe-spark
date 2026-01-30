/**
 * Script de Migration de Domaine SEO
 * ===================================
 * 
 * Ce script automatise la migration des références de domaine dans tout le projet.
 * 
 * UTILISATION:
 * 1. Modifier les constantes OLD_DOMAIN et NEW_DOMAIN ci-dessous
 * 2. Exécuter: npx ts-node scripts/domain-migration.ts --dry-run (pour tester)
 * 3. Exécuter: npx ts-node scripts/domain-migration.ts (pour appliquer)
 * 
 * FICHIERS CIBLÉS:
 * - index.html (métadonnées globales)
 * - src/pages/*.tsx (canonical, Open Graph, JSON-LD)
 * - public/sitemap.xml
 * - public/robots.txt
 * - public/rss.xml
 * - public/.well-known/security.txt
 * 
 * @author KiteSurf Passion
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION - MODIFIER CES VALEURS
// ============================================
const OLD_DOMAIN = 'kitesurfpassion.fr';
const NEW_DOMAIN = 'kitesurfpassion.com'; // Exemple pour migration future

// Patterns de remplacement (protocole inclus)
const REPLACEMENTS = [
  { from: `https://www.${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `https://${OLD_DOMAIN}`, to: `https://www.${NEW_DOMAIN}` },
  { from: `www.${OLD_DOMAIN}`, to: `www.${NEW_DOMAIN}` },
];

// Fichiers et répertoires à scanner
const TARGET_PATHS = [
  'index.html',
  'src/pages',
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

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
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
// FONCTION PRINCIPALE
// ============================================

function runMigration(dryRun: boolean = false): void {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SCRIPT DE MIGRATION DE DOMAINE SEO');
  console.log('='.repeat(60));
  console.log(`\n📋 Configuration:`);
  console.log(`   Ancien domaine: ${OLD_DOMAIN}`);
  console.log(`   Nouveau domaine: ${NEW_DOMAIN}`);
  console.log(`   Mode: ${dryRun ? '🔍 DRY-RUN (simulation)' : '⚡ EXÉCUTION RÉELLE'}`);
  console.log('\n' + '-'.repeat(60));

  // Collecter tous les fichiers
  let allFiles: string[] = [];
  for (const targetPath of TARGET_PATHS) {
    allFiles = getAllFiles(targetPath, allFiles);
  }

  console.log(`\n📁 Fichiers à analyser: ${allFiles.length}`);

  // Exécuter la migration
  const results: MigrationResult[] = [];
  let totalReplacements = 0;

  for (const file of allFiles) {
    const result = migrateFile(file, dryRun);
    if (result) {
      results.push(result);
      totalReplacements += result.replacements;
    }
  }

  // Afficher les résultats
  console.log('\n' + '-'.repeat(60));
  console.log('📊 RÉSULTATS DE LA MIGRATION');
  console.log('-'.repeat(60));

  if (results.length === 0) {
    console.log('\n✅ Aucune occurrence trouvée. Le domaine est déjà à jour.');
  } else {
    console.log(`\n📝 Fichiers modifiés: ${results.length}`);
    console.log(`🔄 Total des remplacements: ${totalReplacements}`);
    console.log('\n📄 Détail par fichier:\n');

    for (const result of results) {
      console.log(`   📁 ${result.file}`);
      console.log(`      └─ ${result.replacements} remplacement(s)`);
      for (const change of result.changes) {
        console.log(`         • ${change}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (dryRun && results.length > 0) {
    console.log('⚠️  MODE DRY-RUN: Aucune modification n\'a été effectuée.');
    console.log('   Pour appliquer les changements, relancez sans --dry-run');
  } else if (!dryRun && results.length > 0) {
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('\n📋 ÉTAPES POST-MIGRATION:');
    console.log('   1. Vérifier visuellement les changements');
    console.log('   2. Tester les balises Open Graph (https://developers.facebook.com/tools/debug/)');
    console.log('   3. Valider les données structurées (https://search.google.com/test/rich-results)');
    console.log('   4. Soumettre le nouveau sitemap dans Google Search Console');
    console.log('   5. Configurer les redirections 301 si nécessaire');
  }
  
  console.log('='.repeat(60) + '\n');
}

// ============================================
// POINT D'ENTRÉE
// ============================================

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

runMigration(isDryRun);
