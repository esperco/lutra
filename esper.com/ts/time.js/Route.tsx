/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.OAuth.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.Charts.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.Onboarding.tsx" />
/// <reference path="./Components.Header.tsx" />
/// <reference path="./Components.Footer.tsx" />

module Esper.Route {

  // Set defaults for header and footer render
  function render(main: React.ReactElement<any>,
                  header?: React.ReactElement<any>,
                  footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Components.Header />;
    }
    if (footer !== null) {
      footer = footer || <Components.Footer />;
    }
    Layout.render(main, header, footer);
  }

  // Check if we need to launch onboarding
  var onboardingRequired: PageJS.Callback = function(ctx, next) {
    if (Onboarding.required()) {
      Route.nav.path(Onboarding.paths[0]);
    } else {
      next();
    }
  }

  // Helper to wrap default pageJs route definition function
  function route(pattern: string, ...callbacks: PageJS.Callback[]) {
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


  ////////

  /*
    Full documentation on path matching at
    https://visionmedia.github.io/page.js/.

    It'd be nice if we could match using types in some way, but that's a bit
    tricky to get working correctly with all of the fancy pattern matching
    features in page.js at the moment.
  */

  // Home page -- distinguish between "#" (does nothing) and "#!" (home)
  var initLoad = true;
  pageJs("", function(ctx) {
    if (initLoad || ctx.pathname.indexOf("!") >= 0) {
      initLoad = false;
      nav.path("/charts");
    }
  });

  // Charts
  route("/charts", onboardingRequired, function() {
    render(<Views.Charts />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.TimeStatsCharts);
  });

  // Calendar labeling page
  route("/calendar-labeling", onboardingRequired, function() {
    render(<Views.CalendarLabeling />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.CalendarLabeling);
  });

  // Onboarding steps
  route("/onboarding/start", function() {
    render(
      <Views.OnboardingStart />,
      Components.onboardingStartHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingStart);
  });

  route("/onboarding/add-cals", function() {
    render(
      <Views.OnboardingAddCals />,
      Components.onboardingAddCalsHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingAddCals);
  });

  route("/onboarding/add-labels", function() {
    render(
      <Views.OnboardingAddLabels />,
      Components.onboardingAddLabelsHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingAddLabels);
  });

  route("/onboarding/label-events", function() {
    render(
      <Views.CalendarLabeling />,
      Components.onboardingLabelEventsHeader(),
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingLabelEvents);
  });

  route("/onboarding/charts", function() {
    render(
      <Views.Charts />,
      Components.onboardingChartsHeader(),
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingCharts);
  });

  // 404 page
  route('*', function(ctx) {
    // To deal with weird issue where hrefs get too many slashes prepended.
    if (ctx.path.slice(0,2) === "//") {
      nav.path(ctx.path.slice(1));
    } else {
      Log.e(ctx);
      render(<Views.NotFound />, null, null);
    }
  });


  // Turn on router
  export function init() {
    pageJs.base("/time");
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
