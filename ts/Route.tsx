/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Views.Index.tsx" />
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

  // Index page
  pageJs("/", function() {
    // Layout.render(<Views.Index />);
    nav.path("/labels-over-time");
  });

  // Graph labels over time
  pageJs("/labels-over-time", loginRequired, function() {
    Layout.render(<Views.LabelsOverTime />,
      undefined,
      <Views.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.LabelsOverTime);
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
