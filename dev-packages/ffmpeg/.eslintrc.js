/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: [
        '@theia/dev-configs/build.eslintrc.json'
    ],
    parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: 'tsconfig.json'
    }
};
