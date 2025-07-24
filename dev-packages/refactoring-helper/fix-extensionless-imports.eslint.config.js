// eslint --fix --rule 'require-extensions/require-extensions: error' .\dev-packages
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";
import { fixupPluginRules } from '@eslint/compat';
import tseslint from 'typescript-eslint';
import eslintPluginReact from 'eslint-plugin-react';
// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname =  import.meta.dirname;

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});


export default [{
    "languageOptions": {
        ecmaVersion: 12,
        sourceType: 'module',
        parser: tseslint.parser,
        //"parser": "@typescript-eslint/parser",
        "parserOptions": {
            "sourceType": "module",
            "ecmaVersion": 6,
            "ecmaFeatures": {
                "jsx": true
            }
        },
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.es2021,
            ...globals.browser,
        }
    },
    //...compat.extends("plugin:require-extensions/recommended"),
    "rules": {
        'require-extensions/require-extensions': 'error',
        'require-extensions/require-index': 'error',
    },
    files: ['**/*.{js,jsx,ts,tsx}'],
    "plugins": {
        "require-extensions": fixupPluginRules(eslintPluginRequireExtensions),
        'react': eslintPluginReact,
        // 'react-native': fixupPluginRules(reactNative),
        '@typescript-eslint': tseslint.plugin,
        // "@theia",
        // "@typescript-eslint",
        // "@typescript-eslint/tslint",
        // "import",
        // "no-null",
        // "eslint-plugin-deprecation",
        // "eslint-plugin-react",
        // "eslint-plugin-no-unsanitized"
    }
},
{
    "ignores": [
        "node_modules",
        "lib"
    ]
}
]

// import { FlatCompat } from "@eslint/eslintrc";
// import react from 'eslint-plugin-react';
// ////import reactNative from 'eslint-plugin-react-native';
// //import fileName from 'eslint-plugin-filename-rules';
// import imprt from 'eslint-plugin-import';
// import tseslint from 'typescript-eslint';
// // import typescriptPlugin from '@typescript-eslint/eslint-plugin';
// // import * as graphqlEslint from "@graphql-eslint/eslint-plugin"
// //import * as folders from 'eslint-plugin-folders';
// // import sonarjs from "eslint-plugin-sonarjs";
// // import prettier from 'eslint-plugin-prettier';
// // import prettierRecommended from 'eslint-plugin-prettier/recommended';
// // import jest from 'eslint-plugin-jest';
// // import eslintPluginUnicorn from 'eslint-plugin-unicorn';
// import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
// import eslint from '@eslint/js';
// // import stylistic from '@stylistic/eslint-plugin'
// import globals from "globals";
// import { fixupPluginRules } from '@eslint/compat';
// import { fileURLToPath } from 'node:url';
// import path from 'node:path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname =  import.meta.dirname;

// const compat = new FlatCompat({
//     baseDirectory: import.meta.dirname,
//     recommendedConfig: eslint.configs.recommended,
//     allConfig: eslint.configs.all
// });

// export default tseslint.config(
//     //reactNative,
//     eslint.configs.recommended,
//     ...compat.extends("plugin:require-extensions/recommended"),
//     // prettierRecommended,
//     // sonarjs.configs.recommended,
//     // ...compat.extends("airbnb"),
//     // ...compat.extends("airbnb-typescript"),
//     ...tseslint.configs.recommended,
//     {
//         ignores: [
//             "src/assets/translations/*",
//             "**/android",
//             "**/ios",
//             "**/package.json",
//             "**/__mocks__",
//             "**/jest-setup",
//             "**/app.json",
//             "**/.eslintrc.js",
//             "**/*.config.js",
//             "**/coverage",
//             "**/schema.graphql",
//             "**/node_modules",
//             "**/*.d.ts",
//             "src/utils/graphql/generated.ts",
//             "src/dev-only-purpose",
//             "**/__generated__",
//         ],
//     },
//     {
//         files: ['**/*.{js,jsx,ts,tsx}'],
//         plugins: {
//             'react': react,
//             // 'react-native': fixupPluginRules(reactNative),
//             '@typescript-eslint': tseslint.plugin,
//             // '@stylistic': stylistic,
//             //'filename-rules': fixupPluginRules(fileName),
//             // 'import': fixupPluginRules(imprt),
//             // 'prettier': prettier,
//             // 'jest': jest,
//             // 'unicorn': eslintPluginUnicorn,
//             // 'folders': fixupPluginRules(folders),
//             // 'sonarjs': sonarjs,
//             'react-hooks': fixupPluginRules(eslintPluginReactHooks)
//         },
//         languageOptions: {
//             ecmaVersion: 12,
//             sourceType: 'module',
//             parser: tseslint.parser,
//             parserOptions: {
//                 ecmaFeatures: { jsx: true },
//                 warnOnUnsupportedTypeScriptVersion: false,
//                 operations: "./src/**/*.graphql",
//                 schema: "./schema.graphql",
//                 project: "./tsconfig.json",
//             },
//             globals: {
//                 ...globals.jest,
//                 ...globals.node,
//                 ...globals.es2021,
//                 ...globals.browser,
//             },
//         },
//         settings: {
//             react: {
//                 version: 'detect',
//             },
//         },
//         ignores: ["**/src/assets/translations/*"],
//         rules: {
//             ...eslintPluginReactHooks.configs.recommended.rules,
//             "sonarjs/cognitive-complexity": "error",
//             "sonarjs/prefer-immediate-return": 0,
//             "sonarjs/no-duplicate-string": 0,
//             "sonarjs/no-nested-template-literals": 0,
//             "sonarjs/no-redundant-jump": 0,
//             "sonarjs/no-small-switch": 0,

//             "import/no-cycle": ["warn", {
//                 ignoreExternal: true,
//             }],

//             "prettier/prettier": 2,

//             "no-console": ["warn", {
//                 allow: ["warn", "error"],
//             }],

//             "@stylistic/comma-dangle": ["error", "always-multiline"],
//             "prefer-destructuring": 2,
//             "camelcase": 2,
//             "object-shorthand": 2,
//             "no-nested-ternary": 1,
//             "no-shadow": 0,
//             "@typescript-eslint/no-shadow": 2,
//             "no-unused-vars": 0,

//             "@typescript-eslint/no-unused-vars": ["error", {
//                 args: "after-used",
//                 argsIgnorePattern: "^_",
//             }],

//             "no-use-before-define": "off",
//             "@typescript-eslint/no-use-before-define": 2,
//             "@typescript-eslint/no-var-requires": 0,
//             "@typescript-eslint/explicit-module-boundary-types": 0,
//             "@typescript-eslint/no-explicit-any": 2,
//             "import/no-default-export": 2,
//             "import/prefer-default-export": 0,
//             "react/require-default-props": 0,

//             "import/no-extraneous-dependencies": ["error", {
//                 devDependencies: true,
//             }],

//             "react/function-component-definition": "off",
//             "react/jsx-uses-react": "off",
//             "react/react-in-jsx-scope": "off",
//             "react/prop-types": "off",

//             "react/jsx-curly-brace-presence": ["error", {
//                 props: "never",
//                 children: "never",
//             }],

//             "react-native/no-inline-styles": 2,
//             "consistent-return": "off",
//             curly: ["error", "all"],
//             "react/display-name": "off",

//             "@typescript-eslint/naming-convention": ["off", {
//                 selector: ["enumMember", "enum"],
//                 format: ["PascalCase"],
//             }],

//             "@typescript-eslint/consistent-type-definitions": ["error", "type"],
//             "unicorn/no-abusive-eslint-disable": "error",

//             "unicorn/filename-case": ["error", {
//                 case: "kebabCase",
//                 ignore: ["[A-Za-z]+.tsx", "[A-Za-z]+.d.ts", "[A-Za-z0-9]+.graphql"],
//             }],

//             "filename-rules/match": [2, {
//                 ".tsx": "PascalCase",
//                 ".ts": {},
//             }],

//             "folders/match-regex": [2, {}, "/src/"],

//             "no-restricted-imports": [1, {
//                 paths: [{
//                     name: "@fresh-direct/theme",
//                     importNames: ["theme", "gaps", "colors"],
//                     message: "Please use useTheme from @rneui/themed instead.",
//                 }, {
//                     name: "react-native",
//                     importNames: ["ScrollView", "FlatList"],
//                     message: "Please consider to use needed element from react-native-gesture-handler; https://github.com/gorhom/react-native-bottom-sheet/issues/770",
//                 }],

//                 patterns: [{
//                     group: ["**/__generated__/types"],
//                     message: "\nIt's a general backend types those might be not available on the client.\nPlease use types provided by the query/hook/service.\nOr use ApiEnums",
//                 }],
//             }],
//         },
//     },
//     // OVERRIDES
//     {
//         files: ['*.json'],
//         plugins: {
//             //'@stylistic': stylistic,
//         },
//         rules: {
//             // '@stylistic/comma-dangle': 'off',
//         },
//     },
//     {
//         files: ['{**/,}/{constants,utils}/{**/,}*.{ts,tsx}'],
//         plugins: {
//             //'filename-rules': fixupPluginRules(fileName),
//         },
//         rules: {
//             // 'filename-rules/match': [
//             //     2,
//             //     {
//             //         '.tsx': 'PascalCase',
//             //         '.ts': 'kebab-case',
//             //     },
//             // ],
//         },
//     },
// )
