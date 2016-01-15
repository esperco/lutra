// Helpers for client-side router

/// <reference path="../typings/page/page.d.ts" />
/// <reference path="./Login.ts" />

module Esper.Route {
  declare var pageJs: PageJS.Static;

  // Helper to wrap default pageJs route definition function
  export function route(pattern: string, ...callbacks: PageJS.Callback[]) {
    pageJs(pattern,

      // Add function to record current path
      (ctx, next) => {
        current = ctx && ctx.path;
        next();
      },

      // Check login status before proceeding
      (ctx, next) => {
        Login.promise.done(next);
      },

      ...callbacks)
  }

  // Track current path
  export var current: string;

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

  // Helper functions to navigate
  export module nav {
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

    // Navigate to a particular page
    export function path(frag: string) {
      pageJs(normalize(frag));
    }

    // Navigate to home page
    export function home() {
      return path("");
    }

    // Get link for href
    export function href(frag: string) {
      return "/#!" + normalize(frag);
    }

    // Is the current path active?
    export function isActive(frag: string) {
      return normalize(current) === normalize(frag);
    }
  }
}
