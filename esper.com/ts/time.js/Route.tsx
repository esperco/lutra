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
/// <reference path="./Views.Event.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.LoadError.tsx" />
/// <reference path="./Views.Header.tsx" />
/// <reference path="./Views.Footer.tsx" />
/// <reference path="./Actions.CalendarSetup.tsx" />
/// <reference path="./Actions.FilterList.tsx" />
/// <reference path="./Actions.NotificationSettings.tsx" />

module Esper.Route {

  // Set defaults for header and footer render
  function render(main: React.ReactElement<any>,
                  header?: React.ReactElement<any>,
                  footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header />;
    }
    if (footer !== null) {
      footer = footer || <Views.Footer />;
    }
    Layout.render(main, header, footer);
  }

  // Helper to check default team created and calendars loaded
  var checkTeamAndCalendars: PageJS.Callback = function(ctx, next) {
    Teams.defaultTeamPromise

      // Uncomment if we want to wait for calendar names to finish loading
      // .then(() => Calendars.calendarLoadPromise)

      .then(next, (err) => {
        Log.e(err);
        render(<Views.LoadError />);
      });
  }

  // Helper to require onboarding for certain pages -- also checks team and
  // calendar promises
  var checkOnboarding: PageJS.Callback = function(ctx, next) {
    checkTeamAndCalendars(ctx, () => {
      if (Onboarding.needsCalendars()) {
        Route.nav.path("/calendar-setup");
      } else {
        next();
      }
    });
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
  route("/charts", checkOnboarding, function() {
    render(<Views.Charts />);
    Analytics.page(Analytics.Page.TimeStatsCharts);
  });

  // Calendar labeling page
  route("/calendar-labeling", checkOnboarding, function() {
    render(<Views.CalendarLabeling />);
    Analytics.page(Analytics.Page.CalendarLabeling);
  });

  // Notification settings page
  route("/notification-settings", checkOnboarding, function(ctx) {
    var msg = Util.getParamByName("msg", ctx.querystring);
    render(Actions.NotificationSettings(msg));
    Analytics.page(Analytics.Page.NotificationSettings);
  });

  // Alias for old references to calendar-settings
  pageJs("/calendar-settings", function(ctx) {
    nav.path("/notification-settings?" + ctx.querystring, {
      replace: true
    });
  });

  // Page for setting up initial teams and calendars
  route("/calendar-setup/:teamid?", checkTeamAndCalendars, function(ctx) {
    render(Actions.CalendarSetup(ctx.params["teamid"]));
    Analytics.page(Analytics.Page.CalendarSetup, {
      teamId: ctx.params["teamid"]
    });
  });

  // Event feedback landing page
  route("/event", checkOnboarding, function(ctx) {
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
        Events.fetch1(teamid, calid, eventid)
          .then((eventKey: string) => {
            render(<Views.EventView teamid={teamid} eventid={eventid}
                                    eventKey={eventKey} />);
          });
      });
    Analytics.page(Analytics.Page.EventFeedback);
  });

  // TODO: Select event and perform labeling action
  // Use ApiT.postEventFeedback() to record the action.
  route("/calendar-labeling/:eventid/:action", checkOnboarding, function(ctx) {
    render(<Views.CalendarLabeling />);
    Analytics.page(Analytics.Page.CalendarLabeling);
  });

  route("/list", checkOnboarding, function(ctx) {
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
