/** @type {import("prettier").Config} */
module.exports = {
  plugins: [
    require.resolve("prettier-plugin-prisma"),
    require.resolve("prettier-plugin-tailwindcss"),
  ],
  overrides: [{ files: "*.prisma", options: { parser: "prisma" } }],
  // Optional defaults
  semi: false,
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
};
