import http, { type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { Stream } from 'node:stream'

import { Context } from './context.js'

export * from './router.js'

export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void

export class Application {
  #server!: Server
  readonly #middlewares: Middleware[] = []

  use(...middlewares: Middleware[]) {
    this.#middlewares.push(...middlewares)
    return this
  }

  listen(port: number, hostname?: string): Promise<void> {
    this.#server = http.createServer(this.#handle.bind(this))
    return new Promise((resolve, reject) => {
      this.#server.listen(port, hostname, resolve)
      this.#server.once('error', reject)
    })
  }

  async #handle(req: IncomingMessage, res: ServerResponse) {
    const ctx = new Context(req, res)
    let i = 0
    const next = async (): Promise<void> => {
      const handler = this.#middlewares[i++]
      await handler?.(ctx, next)
    }
    try {
      await next()
    } catch (err) {
      ctx.status = 500
      ctx.body = (err as Error).stack
    }
    if (ctx.body == null) {
      ctx.status = 404
      ctx.body = 'Not Found'
    }
    if (ctx.body instanceof Stream) {
      ctx.body.pipe(ctx.response)
    } else {
      ctx.response.end(ctx.body)
    }
  }
}
