import { test, expect } from '@playwright/test';
import { articleFAQData } from '../src/pages/BlogArticle';

/**
 * Pour chaque article disposant d'une FAQ, vérifie qu'un bloc JSON-LD
 * FAQPage SÉPARÉ (hors @graph Article) est bien injecté, avec
 * @type "FAQPage" et un mainEntity non vide composé de Question/Answer.
 */
const slugs = Object.keys(articleFAQData);

test.describe('Blog – JSON-LD FAQPage séparé', () => {
  for (const slug of slugs) {
    test(`article "${slug}" expose un script FAQPage standalone`, async ({ page }) => {
      await page.goto(`/blog/${slug}`, { waitUntil: 'domcontentloaded' });
      // Attend qu'au moins un JSON-LD soit injecté par React
      await page.waitForFunction(
        () => document.querySelectorAll('script[type="application/ld+json"]').length > 0,
        { timeout: 10_000 },
      );

      const blocks = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
        nodes
          .map((n) => {
            try { return JSON.parse(n.textContent || ''); } catch { return null; }
          })
          .filter(Boolean),
      );

      // Un bloc FAQPage standalone (pas imbriqué dans @graph)
      const standaloneFaq = blocks.find(
        (b: any) => b && b['@type'] === 'FAQPage' && Array.isArray(b.mainEntity),
      );
      expect(standaloneFaq, `FAQPage standalone manquant pour ${slug}`).toBeTruthy();

      // Pas de FAQPage dupliqué à l'intérieur d'un @graph Article
      const graphFaq = blocks.some(
        (b: any) => Array.isArray(b?.['@graph']) && b['@graph'].some((n: any) => n?.['@type'] === 'FAQPage'),
      );
      expect(graphFaq, `FAQPage dupliqué dans @graph pour ${slug}`).toBe(false);

      // mainEntity = Question[] avec acceptedAnswer.Answer
      const expected = articleFAQData[slug];
      expect(standaloneFaq.mainEntity.length).toBe(expected.length);
      for (const [i, q] of standaloneFaq.mainEntity.entries()) {
        expect(q['@type']).toBe('Question');
        expect(typeof q.name).toBe('string');
        expect(q.name.length).toBeGreaterThan(0);
        expect(q.acceptedAnswer?.['@type']).toBe('Answer');
        expect(typeof q.acceptedAnswer?.text).toBe('string');
        expect(q.acceptedAnswer.text.length).toBeGreaterThan(0);
        // Le texte de la question doit correspondre à la source
        expect(q.name).toBe(expected[i].question);
      }
    });
  }
});