import { Application } from 'okah'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const app = new Application()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

app.get('/', (ctx) => {
  ctx.body = fs.createReadStream(
    path.resolve(fileURLToPath(import.meta.url), '../hello.html')
  )
})

app.get('/sleep', async (ctx, next) => {
  await sleep(5000)
  await next()
  ctx.body = 'Hello, world!'
})

app.get('/headers', (ctx) => {
  ctx.body = JSON.stringify(ctx.headers)
})

const PORT = 3000

await app.listen(PORT)

console.log(`Listening on port http://localhost:${PORT}`)
