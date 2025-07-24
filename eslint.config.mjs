import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
export default tseslint.config([
  // ✅ JavaScript files (.js, .cjs, .mjs)
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        ...globals.es2026,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': 'warn',
    },
  },
  // ✅ TypeScript files (.ts, .cts, .mts)
  {
    files: ['**/*.{ts,cts,mts}'],
    //tsconfigPath: './jsconfig.json', // Or omit for non-type-aware mode
    languageOptions: {
      parser,
      parserOptions: {
        project: './jsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        ...globals.es2026,
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
      prettier,
    },
    rules: {
      ...plugin.configs['strict-type-checked'].rules,
      ...plugin.configs['stylistic-type-checked'].rules,
      'prettier/prettier': 'warn',
    },
  },
]);
