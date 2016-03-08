// Helpers for client-side router

/// <reference path="../lib/Util.ts" />
/// <reference path="./Login.ts" />

module Esper.Route {
  declare var pageJs: PageJS.Static;

  // Helper to wrap default pageJs route definition function
  export function route(pattern: string, ...callbacks: PageJS.Callback[]) {
    var callbacks = preRouteHooks.concat(callbacks);
    pageJs(pattern, ...callbacks);
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
  var backBtnHandlers: { (ctx: PageJS.Context): boolean; }[] = [];

  export function onBack(cb: { (ctx: PageJS.Context): boolean; }) {
    if (! _.includes(backBtnHandlers, cb)) {
      backBtnHandlers.push(cb);
    }
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
  export function setBase(base: string) {
    pageJs.base(base);
  }

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

    // Normalize slashes and hashes
    export function normalize(frag: string) {
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

    // Navigate to a particular page
    export function path(frag: string, opts?: Opts) {
      opts = opts || {};
      var fn = opts.replace ? pageJs.redirect : pageJs;
      var query = opts.queryStr || (opts.jsonQuery ?
        (jsonParam + "=" + encodeURIComponent(JSON.stringify(opts.jsonQuery)))
        : null);
      if (query) { lastQuery = query; }
      var arg = normalize(frag) + (query ? "?" + query : "");
      if (opts.delay) {
        clearTimeout(pathTimeout);
        pathTimeout = setTimeout(() => fn(arg), opts.delay);
      } else {
        fn(arg);
      }
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

    // Get link for href
    export function href(frag: string) {
      return "/#!" + normalize(frag);
    }

    // Is the current path active?
    export function isActive(frag: string) {
      return normalize(current).split("?")[0] ===
             normalize(frag).split("?")[0];
    }
  }
}
