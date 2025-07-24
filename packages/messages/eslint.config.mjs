import { config } from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';
export default config([
  ...baseConfig,
  // ✅ TypeScript files (.ts, .cts, .mts)
  // TODO: here for migration tsconfigPath: './jsconfig.json', // Or omit for non-type-aware mode
  { files: ['**/*.{ts,cts,mts}'], languageOptions: { parserOptions: { project: './tsconfig.json' } } },
]);
