module.exports = {
  root: true,
  extends: ["universe/native", "universe/shared/typescript-analysis"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
