/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />
/// <reference path="./Views.LabelsOverTime.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.LoginRequired.tsx" />

module Esper.Route {

  // Helper for displaying the login required page
  var loginRequired: PageJS.Callback = function(ctx, next) {
    Login.loginPromise.done(next);
    Login.loginPromise.fail(function() {
      Layout.render(<Views.LoginRequired />);
    });

    // If busy, then we keep showing spinner
  }

  // Helper to wrap default pageJs route definition function
  function route(pattern: string, ...callbacks: PageJS.Callback[]) {
    // Add function to record current path
    pageJs(pattern, (ctx, next) => {
      current = ctx && ctx.path;
      next();
    }, ...callbacks)
  }

  // Track current path
  export var current: string;


  ////////

  /*
    Full documentation on path matching at
    https://visionmedia.github.io/page.js/.

    It'd be nice if we could match using types in some way, but that's a bit
    tricky to get working correctly with all of the fancy pattern matching
    features in page.js at the moment.
  */

  // Index page
  route("/", function() {
    // Layout.render(<Views.Index />);
    nav.path("/labels-over-time");
  });

  // Graph labels over time
  route("/labels-over-time", loginRequired, function() {
    Layout.render(<Views.LabelsOverTime />,
      undefined,
      <Views.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.LabelsOverTime);
  });

  // Calendar labeling page
  route("/calendar-labeling", loginRequired, function() {
    Layout.render(<Views.CalendarLabeling />,
      undefined,
      <Views.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.LabelsOverTime);
  });

  // 404 page
  route('*', function(ctx) {
    // To deal with weird issue where hrefs get too many slashes prepended.
    if (ctx.path.slice(0,2) === "//") {
      nav.path(ctx.path.slice(1));
    } else {
      Log.e(ctx);
      Layout.render(<Views.NotFound />, null, null);
    }
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
