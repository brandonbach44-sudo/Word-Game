// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '_archive/*'],
  },
  {
    rules: {
      // Web-oriented rule: it wants apostrophes in JSX text escaped as &apos;.
      // In React Native, text lives inside <Text> and a raw apostrophe is
      // correct — escaping it would only make copy harder to read. Off so real
      // errors aren't buried under dozens of false positives.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
