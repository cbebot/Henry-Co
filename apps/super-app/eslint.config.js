const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/**", "node_modules/**", ".expo/**"],
  },
  {
    settings: {
      "import/resolver": {
        node: true,
      },
    },
    rules: {
      "import/default": "off",
      "import/named": "off",
      "import/namespace": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-duplicates": "off",
      "import/no-unresolved": "off",
    },
  },
];
