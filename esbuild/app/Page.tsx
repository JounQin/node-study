import { Suspense, lazy } from 'react'

const randomPage = Math.random() > 0.5 ? 'A' : 'B'

const LazyComponent = lazy(
  () =>
    // `)` is not allowed in the expression below for now
    // prettier-ignore
    import
     // abc ()
    // abc ()
    // abc () xxxx

    /*x
  x()
  */
     (
      // xxx
      // xxx
      // xxx
      // xxx
      /**
       * b
       */
      `./pages/${
        /** a */
        // xxx
        /** b */ randomPage /** c */
        // yyy
        /** d */
      }`
    )
)

export const Page = () => (
  <Suspense>
    <LazyComponent />
  </Suspense>
)
