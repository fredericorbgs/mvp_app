// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // importa as configurações padrão do Next.js + TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // nosso override: desabilita só o no-explicit-any
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
