/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="../marten/ts/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />
/// <reference path="./Views.LabelsOverTime.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.LoginRequired.tsx" />
/// <reference path="./Views.Onboarding.tsx" />

module Esper.Route {

  // Helper for displaying the login required page
  var loginRequired: PageJS.Callback = function(ctx, next) {
    Login.promise().done(next);
    Login.promise().fail(function() {
      Layout.render(<Views.LoginRequired />);
    });

    // If busy, then we keep showing spinner
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

  // Home page -- distinguish between "#" (does nothing) and "#!" (home)
  var initLoad = true;
  pageJs("", function(ctx) {
    if (initLoad || ctx.pathname.indexOf("!") >= 0) {
      initLoad = false;
      nav.path("/labels-over-time");
    }
  });

  // OAuth login
  route("/login-once/:uid/:hex_landing_url", function(ctx) {
    var landingUrl = Util.hexDecode(ctx.params.hex_landing_url);
    var uid = ctx.params.uid;
    Login.loginOnce(uid).done(() => nav.path(landingUrl));
  });

  // Graph labels over time
  route("/labels-over-time", loginRequired, onboardingRequired, function() {
    Layout.render(<Views.LabelsOverTime />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.LabelsOverTime);
  });

  // Calendar labeling page
  route("/calendar-labeling", loginRequired, onboardingRequired, function() {
    Layout.render(<Views.CalendarLabeling />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.CalendarLabeling);
  });

  // Onboarding steps
  route("/onboarding/start", loginRequired, function() {
    Layout.render(
      <Views.OnboardingStart />,
      Components.onboardingStartHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingStart);
  });

  route("/onboarding/add-cals", loginRequired, function() {
    Layout.render(
      <Views.OnboardingAddCals />,
      Components.onboardingAddCalsHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingAddCals);
  });

  route("/onboarding/add-labels", loginRequired, function() {
    Layout.render(
      <Views.OnboardingAddLabels />,
      Components.onboardingAddLabelsHeader()
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingAddLabels);
  });

  route("/onboarding/label-events", loginRequired, function() {
    Layout.render(
      <Views.CalendarLabeling />,
      Components.onboardingLabelEventsHeader(),
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.TimeStatsOnboardingLabelEvents);
  });

  route("/onboarding/charts", loginRequired, function() {
    Layout.render(
      <Views.LabelsOverTime />,
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
