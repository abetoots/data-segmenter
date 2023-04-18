//plugins define new eslint rules, and configs set wether or not (and how) the rules should be applied.
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    // This disables the formatting rules in ESLint that Prettier is going to be responsible for handling.
    // Make sure it's always the last config, so it gets the chance to override other configs.
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'prefer-const': 'error',
    'no-console': 'warn',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json'],
      },
    },
  },
};
