import boundaries from "./boundaries.rules.mjs";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.vite/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { console: "readonly", process: "readonly", Buffer: "readonly", __dirname: "readonly", __filename: "readonly", module: "readonly", require: "readonly" },
    },
    plugins: { "edgeflow-boundaries": boundaries },
    rules: {
      "edgeflow-boundaries/import-boundaries": ["error", { defaultBoundary: "any" }],
    },
  },
];
