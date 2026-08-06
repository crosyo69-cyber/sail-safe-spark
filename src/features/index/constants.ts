/** Key figures shown in the homepage trust badges block. */
export const TRUST_BADGES = [
  { value: "25+", label: "Années d'expérience" },
  { value: "2 500+", label: "Élèves formés" },
  { value: "4,9/5", label: "Note moyenne" },
  { value: "6", label: "Disciplines proposées" },
] as const;

/** Below-fold sections rendered with content-visibility. */
export const CONTENT_VISIBILITY = {
  gallery: { contentVisibility: "auto", containIntrinsicSize: "0 800px" },
  testimonials: { contentVisibility: "auto", containIntrinsicSize: "0 500px" },
  faq: { contentVisibility: "auto", containIntrinsicSize: "0 700px" },
} as const;
