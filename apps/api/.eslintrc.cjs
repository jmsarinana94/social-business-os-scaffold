module.exports = {
  // ...
  overrides: [
    {
      files: ['test/**/*.ts'],
      env: { jest: true, node: true },
    },
  ],
};
