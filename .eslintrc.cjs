module.exports = {
  root: true,
  extends: ['woofmeow', 'woofmeow/typescript'],
  parserOptions: {
    sourceType: 'module',
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
