import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Application, Router } from 'okah'

const app = new Application()

const router = new Router()

const _filename = fileURLToPath(import.meta.url)

app.use(router.use()).use((ctx, next) => {
  if (ctx.body == null) {
    ctx.status = 404
    ctx.body = fs.createReadStream(path.resolve(_filename, '../404.html'))
  }
  return next()
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

router.get('/', (ctx) => {
  ctx.body = fs.createReadStream(path.resolve(_filename, '../hello.html'))
})

router.get('/sleep', async (ctx, next) => {
  await sleep(5000)
  await next()
  ctx.body = 'Hello, world!'
})

router.get('/headers', (ctx) => {
  ctx.body = JSON.stringify(ctx.headers)
})

const PORT = 3000

await app.listen(PORT)

console.log(`Listening on port http://localhost:${PORT}`)
