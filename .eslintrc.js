module.exports = {
  extends: ["react-app", "airbnb-typescript", "prettier"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["prettier", "only-warn"],
  rules: {
    "import/prefer-default-export": "off",
    "prettier/prettier": "warn",
    "react/destructuring-assignment": "off",
  },
  ignorePatterns: [".eslintrc.js", "*.config.js"],
};
