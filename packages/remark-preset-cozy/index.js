module.exports = {
  settings: {
    bullet: '-',
    fences: true,
    listItemIndent: '1'
  },
  plugins: [
    'remark-preset-lint-recommended',
    ['lint-list-item-indent', 'space']
  ]
}
