module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "plugins": ["callback-function"],
  "rules": {
    "quotes": ["error","single"],
    "semi": ["error","always"],
    "no-console": 0,
    "comma-dangle": ["error", "never"],
    "callback-function/on-newline": "error",
    "indent": ["error", 2]
  },
  "globals": {
    "module": true,
    "process": true,
    "require": true
  }
};
