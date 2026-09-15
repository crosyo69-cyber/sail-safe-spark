/**
 * F-25-J — Points d'assainissement HTML centralisés.
 *
 * DOMPurify reste le moteur de sanitation ; ce module ne fait qu'appliquer une
 * configuration explicite (allowlist de balises/attributs + schémas d'URL sûrs)
 * définie dans `sanitize-config.ts`.
 */
import DOMPurify from "dompurify";
import { marked } from "marked";
import { EMAIL_PREVIEW, MARKDOWN_RICH, MARKDOWN_TEXT_ONLY, type SanitizeProfile } from "./sanitize-config";

const purify = (html: string, profile: SanitizeProfile) =>
  DOMPurify.sanitize(html, profile as unknown as Record<string, unknown>);

/** Markdown éditorial (articles de blog) : images et tableaux autorisés. */
export const renderRichMarkdown = (markdown: string): string =>
  purify(marked.parse(markdown, { async: false }) as string, MARKDOWN_RICH);

/** Markdown produit par un modèle (chatbot, assistant admin) : aucune image externe. */
export const renderModelMarkdown = (markdown: string): string =>
  purify(marked.parse(markdown, { async: false }) as string, MARKDOWN_TEXT_ONLY);

/** Prévisualisation d'un HTML d'e-mail de campagne (styles inline conservés). */
export const renderEmailPreview = (html: string): string => purify(html, EMAIL_PREVIEW);
