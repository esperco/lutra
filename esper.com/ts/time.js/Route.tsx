/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Route.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.Charts.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />
/// <reference path="./Views.CalendarSettings.tsx" />
/// <reference path="./Views.Event.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Components.Header.tsx" />
/// <reference path="./Components.Footer.tsx" />
/// <reference path="./Actions.FilterList.tsx" />

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

  // Calendar settings page
  route("/calendar-settings", function(ctx) {
    render(<Views.CalendarSettings
             teamids={Teams.allIds()}
             message={Util.getParamByName("msg", ctx.querystring)}/>,
      undefined,
      <Components.Footer hoverable={true} />
    );
  });

  // Event feedback landing page
  route("/event", function(ctx) {
    var q = decodeURIComponent(ctx.querystring);
    /* ctx.querystring does not really contain the query of the URL.
       It is just the part of the fragment identifier after '?', i.e.,
         .../time#!/...?{ctx.querystring}
       so we need an explicit url-decoding here for the '&' separators.
     */

    var teamid  = Util.getParamByName("team",   q);
    var calid   = Util.getParamByName("cal",    q);
    var eventid = Util.getParamByName("event",  q);
    var action  = Util.getParamByName("action", q);

    Api.postEventFeedback(teamid, eventid, action)
    .then(function(labels:ApiT.Labels) {
      Api.getGenericEvent(teamid, calid, eventid)
      .then(function(event:ApiT.GenericCalendarEvent) {
        render(<Views.Event event={event} />,
          undefined,
          <Components.Footer hoverable={true} />
        );
      });
    });
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

  route("/list", function(ctx) {
    render(Actions.FilterList(getJSONQuery(ctx)));
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
