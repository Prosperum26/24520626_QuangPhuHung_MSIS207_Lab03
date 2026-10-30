import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  { ignores: ['dist/', 'node_modules/', 'evidence/'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
      // `role` của DeveloperCard là prop dữ liệu, không phải ARIA role: chỉ kiểm phần tử DOM.
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
      'react/no-unknown-property': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='key'][value.expression.name=/^(i|idx|index)$/]", message: 'Dung ID thuc the lam key, khong dung index.' },
      ],
      'no-restricted-globals': ['error', { name: 'alert', message: 'Dung role="alert", khong dung window.alert().' }],
    },
  },
];
