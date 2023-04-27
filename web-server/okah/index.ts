import http, { type IncomingMessage, ServerResponse } from 'node:http'
import { ReadStream } from 'fs'

export class Context {
  readonly #req: IncomingMessage
  readonly #res: ServerResponse

  #body: string | Buffer | Uint8Array | ReadStream | undefined

  get headers() {
    return this.#req.headers
  }

  set status(status: number) {
    this.#res.statusCode = status
  }

  get body() {
    return this.#body
  }

  set body(body: string | Buffer | Uint8Array | ReadStream | undefined) {
    this.#body = body
    if (body instanceof ReadStream) {
      body.pipe(this.#res)
      body.once('end', () => this.#res.end())
    } else {
      this.#res.write(body)
    }
  }

  /**
   * @internal
   */
  get _res() {
    return this.#res
  }

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.#req = req
    this.#res = res
  }
}

export type MiddlewareHandlerFn = (ctx: Context, next: () => Promise<void>) => void

export type MiddlewareHandler = {
  method: string
  path: string
  handler: MiddlewareHandlerFn
}

export class Application {
  readonly #server = http.createServer(this.#handle.bind(this))
  readonly #handlers: MiddlewareHandler[] = []

  listen(port: number, hostname?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#server.listen(port, hostname, resolve)
      this.#server.once('error', reject)
    })
  }

  get(path: string, handler: MiddlewareHandlerFn) {
    this.#handlers.push({
      method: 'GET',
      path,
      handler
    })
  }

  async #handle(req: IncomingMessage, res: ServerResponse) {
    const ctx = new Context(req, res)
    let i = 0
    const next = async (): Promise<void> => {
      const handler = this.#handlers[i++]
      if (!handler) {
        return
      }
      if (handler.method !== req.method) {
        return next()
      }
      if (handler.path !== req.url) {
        return next()
      }
      await handler.handler(ctx, next)
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
    if (!(ctx.body instanceof ReadStream)) {
      ctx._res.end()
    }
  }
}
