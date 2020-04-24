import { getContext } from "svelte";
import { get } from "svelte/store";
import { LOCATION, ROUTER } from "./contexts";
import { resolveLink } from "./utils";
import { navigate } from "./history";

/**
 * Access the current location via a readable store.
 * @returns {import("svelte/store").Readable<{
    href: string;
    origin: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    state: {};
  }>}
 *
 * @example
  ```html
  <script>
    import { useLocation } from "svelte-navigator";

    const location = useLocation();

    $: console.log($location);
    // {
    //   href: "http://localhost:5000/blog?id=123#comments",
    //   origin: "http://localhost:5000",
    //   protocol: "http:",
    //   host: "localhost:5000",
    //   hostname: "localhost",
    //   port: "5000",
    //   pathname: "/blog",
    //   search: "?id=123",
    //   hash: "#comments",
    //   state: {}
    // }
  </script>
  ```
 */
export function useLocation() {
  const { subscribe } = getContext(LOCATION);
  return { subscribe };
}

/**
 * Access the Route currenty matched by the Router from anywhere inside the Router context.
 * You can for example access Route params from outside the rendered Route or
 * from a deeply nested component without prop-drilling.
 *
 * @returns {import("svelte/store").Readable<{
    route: { path: string; uri: string; };
    params: {};
    uri: string;
  }>}
 *
 * @example
  ```html
  <script>
    import { useActiveRoute } from "svelte-navigator";

    const activeRoute = useActiveRoute();

    $: console.log($activeRoute);
    // {
    //   route: {
    //     path: "blog/:id/",
    //     default: false
    //   },
    //   params: {
    //     id: "123"
    //   },
    //   uri: "/blog/123"
    // }
  </script>
  ```
 */
export function useActiveRoute() {
  const { activeRoute } = getContext(ROUTER);
  return { subscribe: activeRoute.subscribe };
}

export function useRouterBase() {
  const { routerBase } = getContext(ROUTER);
  return routerBase;
}

/**
 * Access the parent `Router`s base.
 *
 * @returns {import("svelte/store").Readable<{ path: string; uri: string; }>}
 *
 * @example
  ```html
  <!-- Inside top-level Router -->
  <script>
    import { useBase } from "svelte-navigator";

    const base = useBase();

    $: console.log($base);
    // {
    //   path: "/base",
    //   uri: "/base"
    // }
  </script>

  <!-- Inside nested Router -->
  <script>
    import { useBase } from "svelte-navigator";

    const base = useBase();

    $: console.log($base);
    // {
    //   path: "base/blog/",
    //   uri: "/base/blog"
    // }
  </script>
  ```
 */
export function useBase() {
  const { base } = getContext(ROUTER);
  return base;
}

/**
 * Resolve a given link relative to the current `Route` and the `Router` `basepath`.
 * It is used under the hood in `Link` and `useNavigate`.
 * You can use it to manually resolve links, when using the `link` or `links` actions.
 *
 * @returns {(path: string) => string}
 *
 * @example
  ```html
  <script>
    import { link, useLinkResolve } from "svelte-navigator";

    const resolve = useLinkResolve();
    // `resolvedLink` will be resolved relative to its parent Route
    // and the Router `basepath`
    const resolvedLink = resolve("relativePath");
  </script>

  <a href={resolvedLink} use:link>Relative link</a>
  ```
 */
export function useLinkResolve() {
  const base = useBase();
  const routerBase = useRouterBase();
  /**
   * Resolves the path relative to the current route and basepath.
   *
   * @param {string} path The path to navigate to
   * @returns {string} The resolved path
   */
  const resolve = path => {
    const { uri: basepath } = get(base);
    const { uri } = get(routerBase);
    return resolveLink(path, basepath, uri);
  };
  return resolve;
}

/**
 * A hook, that returns a context-aware version of `navigate`.
 * It will automatically resolve the given link relative to the current Route.
 * It will also resolve a link against the `basepath` of the Router.
 *
 * @example
  ```html
  <!-- App.svelte -->
  <script>
    import { link, Route } from "svelte-navigator";
    import RouteComponent from "./RouteComponent.svelte";
  </script>

  <Router>
    <Route path="route1">
      <RouteComponent />
    </Route>
    <!-- ... -->
  </Router>

  <!-- RouteComponent.svelte -->
  <script>
    import { useNavigate } from "svelte-navigator";

    const navigate = useNavigate();
  </script>

  <button on:click="{() => navigate('relativePath')}">
    go to /route1/relativePath
  </button>
  <button on:click="{() => navigate('/absolutePath')}">
    go to /absolutePath
  </button>
  ```
  *
  * @example
  ```html
  <!-- App.svelte -->
  <script>
    import { link, Route } from "svelte-navigator";
    import RouteComponent from "./RouteComponent.svelte";
  </script>

  <Router basepath="/base">
    <Route path="route1">
      <RouteComponent />
    </Route>
    <!-- ... -->
  </Router>

  <!-- RouteComponent.svelte -->
  <script>
    import { useNavigate } from "svelte-navigator";

    const navigate = useNavigate();
  </script>

  <button on:click="{() => navigate('relativePath')}">
    go to /base/route1/relativePath
  </button>
  <button on:click="{() => navigate('/absolutePath')}">
    go to /base/absolutePath
  </button>
  ```
 */
export function useNavigate() {
  const resolve = useLinkResolve();
  /**
   * Navigate to a new route.
   * Resolves the link relative to the current route and basepath.
   *
   * @param {string} to The path to navigate to
   * @param {Object} options
   * @param {*} [options.state]
   * @param {boolean} [options.replace=false]
   */
  const navigateRelative = (to, { state, replace = false } = {}) =>
    navigate(resolve(to), { state, replace });
  return navigateRelative;
}