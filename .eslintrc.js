module.exports = {
    "extends": "airbnb-base",
    "installedESLint": true,
    "plugins": [
        "import"
    ],
    "rules": {
      "no-use-before-define": ["error", { "functions": false}],
      "quote-props": 0
    }
};
