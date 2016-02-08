/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Route.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.Charts.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />
/// <reference path="./Views.NotFound.tsx" />
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
  route("/charts", function() {
    render(<Views.Charts />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.TimeStatsCharts);
  });

  // Calendar labeling page
  route("/calendar-labeling", function() {
    render(<Views.CalendarLabeling />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.CalendarLabeling);
  });

  // TODO: Select event and perform labeling action
  // Use ApiT.postEventFeedback() to record the action.
  route("/calendar-labeling/:eventid/:action", function(ctx) {
    render(<Views.CalendarLabeling />,
      undefined,
      <Components.Footer hoverable={true} />
    );
    Analytics.page(Analytics.Page.CalendarLabeling);
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
}
