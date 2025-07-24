import reactPlugin from "eslint-plugin-react";
//import { defineConfig } from "eslint/config";
import pkg from './package.json' with { type: "json" };
import baseConfig, { defineConfig } from '@theia/github-repo/eslint.config.mjs';
import parser from "@typescript-eslint/parser";

export default defineConfig([
    ...baseConfig,
    //reactPlugin.configs.flat.recommended,
    {
        files: ["**/*.{ts,mts,cts,jsx,tsx}"],
        languageOptions: {
            parserOptions: {
                parser,
                tsconfigRootDir: import.meta.dirname,
                project: 'tsconfig.json',
                sourceType: 'module',
                ecmaVersion: "latest",
                ecmaFeatures: {
                    jsx: true,
                    // ...reactPlugin.configs.flat['jsx-runtime'].languageOptions.parserOptions.ecmaFeatures
                    decorators: true, // 🔥 Enable decorator support
                    experimentalObjectRestSpread: true
                }
            },
        },
        plugins: reactPlugin.configs.flat['jsx-runtime'].plugins,
        rules: reactPlugin.configs.recommended.rules,
    },
    {
        "name": `${pkg.name} - ESLint 9 Config`,
        files: ["**/*.{js,mjs,cjs}"], languageOptions: { parserOptions: { project: null } }
    },
]);
