// Helpers for client-side router

/// <reference path="./Paths.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Login.ts" />

module Esper.Route {
  declare var pageJs: PageJS.Static;

  // Helper to wrap default pageJs route definition function
  export function route(pattern: string, ...callbacks: PageJS.Callback[]) {
    var callbacks = preRouteHooks.concat(callbacks);
    pageJs(pattern, ...callbacks);
  }

  export function redirectPath(newPath: Paths.Path): PageJS.Callback {
    return function(ctx) {
      nav.go(newPath, {
        queryStr: ctx.querystring,
        replace: true
      });
    }
  }

  /* Hash-paths for home and not-found pages to handle quirks */

  // Home page -- distinguish between "#" (does nothing) and "#!" (home)
  var initLoad = true;
  export function routeHome(...callbacks: PageJS.Callback[]) {
    route("", function(ctx, next) {
      if (initLoad || ctx.pathname.indexOf("!") >= 0) {
        initLoad = false;
        next();
      }
    }, ...callbacks);
  }

  export function routeNotFound(...callbacks: PageJS.Callback[]) {
    route('*', function(ctx, next) {
      // To deal with weird issue where hrefs get too many slashes prepended.
      if (ctx.path.slice(0,2) === "//") {
        nav.path(ctx.path.slice(1));
      } else {
        Log.e(ctx);
        next();
      }
    }, ...callbacks);
  }


  //////////

  const jsonParam = "q";

  // Random pre-route hooks other modules can modify
  export var preRouteHooks: PageJS.Callback[] = [
    // Add function to record current path
    (ctx, next) => {
      current = ctx && ctx.path;
      next();
    },

    // Modify query string to include lastQuery. Also, contains workaround
    // for https://github.com/visionmedia/page.js/issues/216
    (ctx, next) => {
      if (lastQuery) {
        ctx.querystring = lastQuery;
        lastQuery = undefined;
      } else {
        ctx.querystring = ctx.canonicalPath.split("?")[1] || "";
      }
      next();
    },

    // Check login status before proceeding
    (ctx, next) => {
      Login.promise.done(next);
    },

    /*
      On mobile, users expect back button to close modals and whatnot. To
      do that, we hook into routing system to detect when back button is pressed.
      If a modal is visible, we close the modal and then go forward again (so
      a user must hit back twice to close a modal and go back a page).

      Note that this may trigger a re-render when we go forward again.
    */
    (ctx, next) => {
      // Seen means the back button was pressed
      if (ctx.state.seen) {
        for (var i in backBtnHandlers) {
          var fn = backBtnHandlers[i];
          if (fn(ctx) === false) {
            history.forward();
            return;
          }
        }
      } else {
        ctx.state.seen = true;
        if (firstPage) {
          ctx.save(); // Explicit save seems required for first page

          // Add an extra state object to handle first page
          history.pushState(ctx.state, document.title);

          firstPage = false;
        }
      }
      next();
    }
  ];

  // Track current path
  export var current: string;

  // Track last query (void of "?") in order to handle situations where
  // querystring may get too long
  export var lastQuery: string;

  // Track if this is the first page in the stack (used above)
  var firstPage = true;

  // Back button handlers -- takes PageJS context. Return false to stay on the
  // existing page
  interface BackBtnHandler {
    (ctx: PageJS.Context): boolean;
  };

  export var backBtnHandlers: BackBtnHandler[] = [];

  export function onBack(cb: BackBtnHandler) {
    if (! _.includes(backBtnHandlers, cb)) {
      backBtnHandlers.push(cb);
    }
  }

  export function offBack(cb: BackBtnHandler) {
    backBtnHandlers = _.without(backBtnHandlers, cb);
  }

  export function getJSONQuery(ctx: PageJS.Context): any {
    var str = Util.getParamByName(jsonParam, ctx.querystring);
    try {
      return JSON.parse(str);
    } catch (err) {
      return null;
    }
  }


  //////

  // Use to set base path
  export function setBase(b: string) {
    pageJs.base(b);
    base = b;
  }

  export var base = "";

  // Turn on router
  export function init() {
    pageJs({
      click: false,
      hashbang: true
    });
  }


  //////

  // Helper functions to navigate
  export module nav {
    export interface Opts {
      delay?: number;
      replace?: boolean;

      // jsonQuery converts query to a JSON string. Mutually exclusive with
      // queryStr (which just passes query as is)
      queryStr?: string;
      jsonQuery?: any;

      // State variables to pass to history
      state?: any;
    };

    // Normalize slashes and hashes in a hash
    function normalize(fragArg: string|string[]) {
      var frag = fragArg instanceof Array ? mkPath(fragArg) : fragArg;
      if (! frag) {
        return "";
      }
      if (frag[0] === "#") {
        frag = frag.slice(1);
      }
      if (frag[0] === "!") {
        frag = frag.slice(1);
      }
      if (frag[0] !== "/") {
        frag = "/" + frag;
      }
      return frag;
    }

    // Tracker for path timeout
    var pathTimeout: number;

    /* Is arg an instance of Paths.Path? */
    function isPath(a: Paths.Path|string|string[]): a is Paths.Path {
      return (<any> a).hasOwnProperty("base") &&
             (<any> a).hasOwnProperty("hash");
    }

    // Navigate to a particular page -- if string or array of strings, treat
    // as hash. Else if Path with base, go to new page
    export function go(dest: string|string[]|Paths.Path, opts?: Opts) {
      opts = opts || {};
      var fn: (x: string) => void;
      var arg: string;

      if (isPath(dest)) {
        if (dest.base !== base) {
          fn = (p: string) => location.href = p;
          arg = dest.href + getQueryStr(opts);
        } else {
          fn = opts.replace ? pageJs.redirect : pageJs;
          arg = normalize(dest.hash) + getQueryStr(opts);
        }
      } else {
        fn = opts.replace ? pageJs.redirect : pageJs;
        arg = normalize(dest) + getQueryStr(opts);
      }

      if (opts.delay) {
        clearTimeout(pathTimeout);
        pathTimeout = setTimeout(() => fn(arg), opts.delay);
      } else {
        fn(arg);
      }
    }

    // Get link for path
    export function href(dest: string|string[]|Paths.Path, opts?: Opts) {
      let href = isPath(dest) ? dest.href : normalize(dest);
      return href + getQueryStr(opts);
    }

    // Alias for old code
    export var path = go;

    // Get hash as string
    function getHash(frag: string|string[], opts?: Opts) {
      return normalize(frag) + getQueryStr(opts);
    }

    function getQueryStr(opts?: Opts) {
      opts = opts || {};
      var query = opts.queryStr || (opts.jsonQuery ?
        (jsonParam + "=" + encodeURIComponent(JSON.stringify(opts.jsonQuery)))
        : null);
      if (query) { lastQuery = query; }
      return (query ? "?" + query : "");
    }

    function mkPath(args: string[]) {
      return _.map(args, encodeURIComponent).join("/");
    }

    // Navigate to home page
    export function home() {
      return path("/");
    }

    // Shortcut to handle querystring on current page
    export function query(q: any, opts?: Opts) {
      var queryOpts: Opts = {};
      if (typeof q === "string") {
        queryOpts.queryStr = q;
      } else {
        queryOpts.jsonQuery = q;
      }
      return path(current ? current.split("?")[0] : "",
        _.extend(queryOpts, opts)
      );
    }

    // Re-run route without actually refreshing
    export function refresh() {
      return pageJs(current);
    }

    // Like refresh, but can be called multiple times per "tick" and trigger
    // only a single refresh
    export function refreshOnce() {
      refreshRequired = true;
      window.requestAnimationFrame(() => {
        if (refreshRequired) {
          refreshRequired = false;
          refresh();
        }
      });
    }

    var refreshRequired = false;

    // Is the current path active?
    export function isActive(path: Paths.Path|string) {
      var frag: string;

      // If path, check base -- else, just check hash
      if (isPath(path)) {
        if (path.base !== base) return false;
        frag = path.hash;
      } else {
        frag = path;
      }

      /*
        Check current path starts with frag (assume nested paths
        are "active" forms of parent paths)
      */
      let normCurrent = normalize(current).split("?")[0];
      let normFrag = normalize(frag).split("?")[0];
      return _.startsWith(normCurrent, normFrag);
    }
  }
}
