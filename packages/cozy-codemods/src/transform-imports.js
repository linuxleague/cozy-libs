const groupBy = require('lodash/groupBy')
const flatten = require('lodash/flatten')

/**
 * Merge imports with the same source.
 *
 * @param  {Object} j - The jscodeshift API
 * @param  {Object} root - The jscodeshift root node
 *
 * @example
 * Before:
 *
 * ```
 * import { A } from 'my-package'
 * import { B } from 'my-package'
 * ```
 *
 * After:
 *
 * ```
 * import { A, B } from 'my-package'
 * ```
 */
const mergeImports = (j, root) => {
  const imports = root.find(j.ImportDeclaration).paths()
  const groupedBySource = groupBy(imports, path => path.node.source.value)
  for (const group of Object.values(groupedBySource)) {
    if (group.length === 1) {
      continue
    }
    const specifiers = flatten(group.map(x => x.node.specifiers))
    group[0].replace(j.importDeclaration(specifiers, group[0].node.source))
    for (let toRemove of group.slice(1)) {
      toRemove.prune()
    }
  }
}

/**
 * Transform import statements so that they match paths passed in options.
 *
 * @param  {Object} j - The jscodeshift API
 * @param  {Object} root - The jscodeshift root node
 * @param  {Object} options
 *
 * @example
 *
 * ```jsx
 * // See https://github.com/facebook/jscodeshift
 * transformImports(j, root, {
 *   imports: {
 *     Dialog: {
 *       importPath: 'cozy-ui/transpiled/react/Dialog',
 *       defaultImport: true
 *     },
 *     DialogFile: {
 *       importPath: 'cozy-ui/transpiled/react/Dialog',
 *       defaultImport: false
 *     },
 *     DialogContent: {
 *       importPath: 'cozy-ui/transpiled/react/Dialog',
 *       defaultImport: false
 *     }
 *   }
 * })
 * ```
 *
 * Before:
 *
 * ```
 * import DialogFile from 'cozy-ui/transpiled/react/DialogFile'
 * import DialogContent from 'cozy-ui/transpiled/react/DialogContent'
 * import Dialog from 'cozy-ui/transpiled/react/Dialog'
 * ```
 *
 * After:
 *
 * ```
 * import Dialog, { DialogFile, DialogContent } from "cozy-ui/transpiled/react/Dialog";
 * ```
 */
const transformImports = (j, root, options) => {
  const imports = options.imports
  const identifiers = Object.keys(imports)
  root.find(j.ImportDeclaration).forEach(path => {
    const specifiers = path.node.specifiers
    if (!specifiers || !specifiers.length) {
      return
    }
    for (let i = specifiers.length - 1; i >= 0; i--) {
      const specifier = specifiers[i]
      const found = identifiers.find(id => id === specifier.local.name)
      if (found) {
        const importSpec = imports[found]
        specifiers.splice(i, 1)
        path.insertAfter(
          j.importDeclaration(
            [
              importSpec.defaultImport
                ? j.importDefaultSpecifier(j.identifier(found))
                : j.importSpecifier(j.identifier(found))
            ],
            j.literal(importSpec.importPath)
          )
        )
      }
    }

    if (specifiers.length === 0) {
      path.prune()
    }
  })
  mergeImports(j, root)
}

module.exports = transformImports
