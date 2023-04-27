import { Middleware } from './index.js'
import { HttpMethod } from './constant.js'

export type Route = {
  path: string
  method: HttpMethod
  handler: Middleware
}

export class Router {
  readonly #routes: Route[] = []

  use(): Middleware
  use(path: string, method: HttpMethod, handler: Middleware): this
  use(...args: [string, HttpMethod, Middleware] | []) {
    if (args.length !== 0) {
      const [path, method, handler] = args
      this.#routes.push({ path, method, handler })
      return this
    }

    const middleware: Middleware = (ctx, next) => {
      const { url, method } = ctx.request
      const route = this.#routes.find(
        (route) => route.path === url && route.method === method
      )
      if (route == null) {
        return next()
      }
      return route.handler(ctx, next)
    }

    return middleware
  }

  delete(path: string, handler: Middleware) {
    this.use(path, HttpMethod.DELETE, handler)
  }

  get(path: string, handler: Middleware) {
    this.use(path, HttpMethod.GET, handler)
  }

  patch(path: string, handler: Middleware) {
    this.use(path, HttpMethod.PATCH, handler)
  }

  post(path: string, handler: Middleware) {
    this.use(path, HttpMethod.POST, handler)
  }

  put(path: string, handler: Middleware) {
    this.use(path, HttpMethod.PUT, handler)
  }

  head(path: string, handler: Middleware) {
    this.use(path, HttpMethod.HEAD, handler)
  }

  options(path: string, handler: Middleware) {
    this.use(path, HttpMethod.OPTIONS, handler)
  }
}
