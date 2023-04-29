import fs from 'node:fs/promises'
import { dirname } from 'node:path'

import { type Plugin } from 'esbuild'
import glob from 'fast-glob'

const DYNAMIC_IMPORT_REGEX =
  /\bimport((\r?\n)*\s*(\/\*[\s\S]*?\*\/|\/\/.*))*\s*\(([^)]+)\)/g

const COMMENTS_REGEX = /\/\*[\s\S]*?\*\/|\/\/.*/g

const LOADERS = {
  '.js': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.cjs': 'js',
  '.mjs': 'js',
  '.cts': 'tsx',
  '.mts': 'tsx',
} as const

export const dynamicImportPlugin = (): Plugin => ({
  name: 'dynamic-import',
  setup(build) {
    build.onLoad({ filter: /\.([cm]?[jt]s|[jt]sx)$/ }, async ({ path }) => {
      const ext = path.slice(path.lastIndexOf('.')) as keyof typeof LOADERS

      let contents = await fs.readFile(path, 'utf8')

      const matches = contents.matchAll(DYNAMIC_IMPORT_REGEX)

      let dynamicImportIndex = -1

      for (const match of matches) {
        const [full, _, __, ___, importPath] = match

        const plainPath = importPath.replaceAll(COMMENTS_REGEX, '').trim()

        if (
          plainPath[0] !== '`' ||
          plainPath[1] !== '.' ||
          plainPath[plainPath[2] === '.' ? 3 : 2] !== '/' ||
          plainPath[plainPath.length - 1] !== '`' ||
          !plainPath.includes('${')
        ) {
          continue
        }

        const globImport = plainPath
          .replaceAll(/\$\{([\s\S]*)\}/g, '*')
          .slice(1, -1)

        let paths = await glob(globImport, {
          cwd: dirname(path),
          globstar: false,
        })

        if (globImport.lastIndexOf('*') > globImport.lastIndexOf('.')) {
          paths = paths.map((p) => {
            const index = p.lastIndexOf('.')
            return index > 0 ? p.slice(0, index) : p
          })
        }

        contents =
          `function __dynamicImportRuntime${++dynamicImportIndex}__(path) { switch (path) {
        ${paths.map((p) => `case '${p}': return import('${p}');`).join('\n')}
        ${`default: return new Promise(function(resolve, reject) {
              (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
                reject.bind(null, new Error("Unknown variable dynamic import: " + path))
              );
            })\n`}   }
         }\n\n` +
          contents.replace(
            full,
            full.replace('import', `__dynamicImportRuntime${dynamicImportIndex}__`)
          )
      }
      return {
        contents,
        loader: LOADERS[ext],
      }
    })
  },
})
