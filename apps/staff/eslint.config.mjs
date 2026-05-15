import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18nRules from "@henryco/eslint-i18n-rules";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "@henryco/i18n": i18nRules,
    },
    rules: {
      "@henryco/i18n/no-hardcoded-jsx-text": "warn",
      "@henryco/i18n/no-hardcoded-string-prop": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
