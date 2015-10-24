/// <reference path="./Esper.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.NotFound.tsx" />

module Esper.Route {

  // Index page
  pageJs("/", function() {
    Layout.render(<Views.Index />);
  });

  // 404 page
  pageJs('*', function() {
    Layout.render(<Views.NotFound />, null, null);
  });

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
  }
}
