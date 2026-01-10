const prettierConfig = {
  plugins: [
    'prettier-plugin-tailwindcss',
    '@trivago/prettier-plugin-sort-imports'
  ],

  importOrder: ['^node:', '^react(/.*)?$', '^next(/.*)?$', '^@/.*', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  singleQuote: true,
  semi: false,
  trailingComma: 'none',
  printWidth: 80,
  tabWidth: 2,
  arrowParens: 'always',
  bracketSpacing: true
}

export default prettierConfig
