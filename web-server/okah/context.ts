import { IncomingMessage, ServerResponse } from 'node:http'
import { type Stream } from 'node:stream'

export class Context {
  readonly #req: IncomingMessage
  readonly #res: ServerResponse

  #body: string | Buffer | Uint8Array | Stream | undefined

  get headers() {
    return this.#req.headers
  }

  set status(status: number) {
    this.#res.statusCode = status
  }

  get body() {
    return this.#body
  }

  set body(body: string | Buffer | Uint8Array | Stream | undefined) {
    this.#body = body
  }

  get request() {
    return this.#req
  }

  get response() {
    return this.#res
  }

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.#req = req
    this.#res = res
  }
}
