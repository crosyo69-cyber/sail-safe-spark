import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Fichiers antérieurs au standard "Architecture Services" (LOT 1/2).
 * Ils restent tolérés (warning) le temps de leur migration, mais AUCUN
 * nouveau fichier ne peut rejoindre cette liste : tout nouveau code doit
 * passer par src/services + src/hooks/services.
 */
const LEGACY_DIRECT_SUPABASE = [
  "src/components/BlogComments.tsx",
  "src/components/ChatBot.tsx",
  "src/components/WaitlistDialog.tsx",
  "src/components/WeatherAlertSubscription.tsx",
  "src/components/admin/Admin404Monitor.tsx",
  "src/components/admin/AdminAlertsCenter.tsx",
  "src/components/admin/AdminCreditStats.tsx",
  "src/components/admin/AdminEmailDashboard.tsx",
  "src/components/admin/AdminNotificationsBell.tsx",
  "src/components/admin/AdminOverview.tsx",
  "src/components/admin/AdminPackagesManager.tsx",
  "src/components/admin/AdminPlatformHealth.tsx",
  "src/components/admin/AdminReservationList.tsx",
  "src/components/admin/AdminRevenueDashboard.tsx",
  "src/components/admin/AdminSeasonStats.tsx",
  "src/components/admin/AdminStudentsManager.tsx",
  "src/components/admin/AssistantActions.tsx",
  "src/components/admin/AssistantBriefing.tsx",
  "src/components/admin/AssistantFinances.tsx",
  "src/components/admin/CampaignEditor.tsx",
  "src/components/admin/CrmClientSheet.tsx",
  "src/components/admin/SegmentBuilder.tsx",
  "src/components/sections/CTASection.tsx",
  "src/components/sections/DepositPaymentSection.tsx",
  "src/pages/AdminAssistant.tsx",
  "src/pages/AdminCRM.tsx",
  "src/pages/AdminCampagnes.tsx",
  "src/pages/AdminCredits.tsx",
  "src/pages/AdminMarketing.tsx",
  "src/pages/Auth.tsx",
  "src/pages/Contact.tsx",
  "src/pages/EfoilAssistFoil.tsx",
  "src/pages/MonEspace.tsx",
  "src/pages/NotFound.tsx",
  "src/pages/OAuthConsent.tsx",
  "src/pages/PreferencesMarketing.tsx",
  "src/pages/Reserver.tsx",
  "src/pages/UnsubscribeAlerts.tsx",
  "src/pages/WaitlistConfirm.tsx",
];

/** Couche React : pages, composants, hooks d'administration. */
const REACT_LAYER = [
  "src/pages/**/*.{ts,tsx}",
  "src/components/**/*.{ts,tsx}",
  "src/hooks/admin/**/*.{ts,tsx}",
];

const ARCHITECTURE_RULES = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/integrations/supabase/client",
            "**/integrations/supabase/client",
            "@supabase/supabase-js",
          ],
          message:
            "Architecture Services : interdit ici. Passez par src/services/*.service.ts puis src/hooks/services/*.",
        },
      ],
    },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector: "CallExpression[callee.name='fetch']",
      message:
        "Architecture Services : pas de fetch() dans React. Déplacez l'appel réseau dans un service (createApiClient).",
    },
    {
      selector: "MemberExpression[object.name='window'][property.name='fetch']",
      message: "Architecture Services : pas de fetch() dans React. Utilisez un service.",
    },
    {
      selector: "CallExpression[callee.property.name='rpc']",
      message:
        "Architecture Services : aucun RPC dans React. Déclarez-le dans un service métier.",
    },
    {
      selector: "MemberExpression[property.name='invoke'][object.property.name='functions']",
      message:
        "Architecture Services : les Edge Functions s'appellent uniquement depuis un service.",
    },
  ],
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Standard obligatoire : Page → Hook admin → Hook React Query → Service → createApiClient → Supabase
  {
    files: REACT_LAYER,
    rules: ARCHITECTURE_RULES,
  },
  // Dette héritée : signalée mais non bloquante tant que la migration n'est pas finie.
  {
    files: LEGACY_DIRECT_SUPABASE,
    rules: {
      "no-restricted-imports": ["warn", ARCHITECTURE_RULES["no-restricted-imports"][1]],
      "no-restricted-syntax": ["warn", ...ARCHITECTURE_RULES["no-restricted-syntax"].slice(1)],
    },
  },
  {
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "no-duplicate-imports": "error",
      "@typescript-eslint/no-duplicate-imports": "off",
    },
  },
);
