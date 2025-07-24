/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: [
        '@theia/github-repo/configs/build.eslintrc.json'
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json'
    }
};
