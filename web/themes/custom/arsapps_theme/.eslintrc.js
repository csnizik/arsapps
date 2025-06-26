module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Add custom rules as needed
  },
  globals: {
    Drupal: 'readonly',
    drupalSettings: 'readonly',
    jQuery: 'readonly',
    $: 'readonly',
  },
};