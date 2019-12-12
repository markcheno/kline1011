module.exports = {
  root: true,
  env: {
    node: true,
    jquery: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    'arrow-parens': 'off',
    'newline-per-chained-call': 'off',
    'max-len': 'off',
    'no-useless-constructor': 'off',
    'object-curly-newline': 'off',
    'import/no-cycle': 'off',
    'no-plusplus': 'off',
    'no-restricted-properties': 'off',
    'operator-assignment': 'off',
    'no-unused-expressions': 'off',
    'no-param-reassign': 'off',
    'no-continue': 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
