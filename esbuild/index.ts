import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import watcher from '@parcel/watcher'
import esbuild, { type BuildContext } from 'esbuild'

const _filename = fileURLToPath(import.meta.url)

let ctx: BuildContext | undefined

/**
 * @see https://github.com/nodejs/modules/issues/307#issuecomment-1382183511
 */
async function importFresh<T>(modulePath: string) {
  const filepath = fileURLToPath(await import.meta.resolve!(modulePath))
  const newFilepath =
    filepath.slice(0, filepath.lastIndexOf('.')) +
    '-' +
    Date.now() +
    path.extname(filepath)

  try {
    await fs.writeFile(newFilepath, await fs.readFile(filepath))
    return (await import(newFilepath)) as T
  } finally {
    await fs.unlink(newFilepath)
  }
}

const build = async () => {
  await ctx?.cancel()
  const { dynamicImportPlugin } = await importFresh<
    typeof import('esbuild-plugin-dynamic-import')
  >('esbuild-plugin-dynamic-import')
  ctx = await esbuild.context({
    absWorkingDir: path.resolve(_filename, '..'),
    entryPoints: ['app/index.tsx'],
    plugins: [dynamicImportPlugin()],
    bundle: true,
    // external: ['react', 'react-dom'],
    outdir: 'dist',
  })
  ctx.watch()
}

watcher.subscribe(
  path.resolve(_filename, '../esbuild-plugin-dynamic-import'),
  (err) => {
    if (err) {
      console.error(err)
      return
    }

    build()
    console.log('Rebuilding...')
  },
  {
    // temporary files for fixing dynamic import cache
    ignore: ['*-[0-9]*.ts'],
  }
)

build()

console.log('Watching...')
