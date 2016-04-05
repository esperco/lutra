/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Route.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Actions.tsx" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.LoadError.tsx" />
/// <reference path="./Actions.CalendarLabeling.tsx" />
/// <reference path="./Actions.CalendarSetup.tsx" />
/// <reference path="./Actions.Charts.tsx" />
/// <reference path="./Actions.Event.tsx" />
/// <reference path="./Actions.FilterList.tsx" />
/// <reference path="./Actions.LabelManage.tsx" />
/// <reference path="./Actions.NotificationSettings.tsx" />

module Esper.Route {

  // Shortcut for simple routes
  var render = Actions.render;

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
  route("/charts/:chartId?/:teamId?/:calIds?/:interval?/:period?",
    checkOnboarding,
  function(ctx) {
    var teamId = Actions.cleanTeamId(ctx.params["teamId"]);
    var calIds = Actions.cleanCalIds(teamId, ctx.params["calIds"]);
    var interval = Actions.cleanInterval(ctx.params["interval"], "month");
    var period = Actions.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderChart({
      chartId: ctx.params["chartId"],
      cals: _.map(calIds, (c) => ({ calId: c, teamId: teamId })),
      period: period,
      filterParams: getJSONQuery(ctx)
    });
  });

  // Calendar labeling page
  route("/calendar-labeling/:teamId?/:calIds?/:interval?/:period?",
    checkOnboarding,
  function(ctx) {
    var teamId = Actions.cleanTeamId(ctx.params["teamId"]);
    var calIds = Actions.cleanCalIds(teamId, ctx.params["calIds"]);
    var interval = Actions.cleanInterval(ctx.params["interval"], "month");
    var period = Actions.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderCalendarLabeling(_.map(calIds, (calId) => ({
      teamId: teamId,
      calId: calId
    })), period);
  });

  // Notification settings page
  route("/notification-settings", checkOnboarding, function(ctx) {
    var msg = Util.getParamByName("msg", ctx.querystring);
    Actions.renderNotificationSettings(msg);
  });

  // Alias for old references to calendar-settings
  pageJs("/calendar-settings", function(ctx) {
    nav.path("/notification-settings?" + ctx.querystring, {
      replace: true
    });
  });

  // Page for setting up initial teams and calendars
  route("/calendar-setup/:teamid?", checkTeamAndCalendars, function(ctx) {
    Actions.renderCalendarSetup(ctx.params["teamid"]);
  });

  // Event feedback landing page
  route("/event", checkOnboarding, function(ctx) {
    var q = decodeURIComponent(ctx.querystring);
    /* ctx.querystring does not really contain the query of the URL.
       It is just the part of the fragment identifier after '?', i.e.,
         .../time#!/...?{ctx.querystring}
       so we need an explicit url-decoding here for the '&' separators.
     */
    Actions.renderEvent({
      teamId  : Util.getParamByName("team",   q),
      calId   : Util.getParamByName("cal",    q),
      eventId : Util.getParamByName("event",  q),
      action  : Util.getParamByName("action", q)
    });
  });

  route("/labels/:teamid?", checkOnboarding, function(ctx) {
    Actions.renderLabelManage(ctx.params["teamid"]);
  });

  route("/list/:teamId?/:calIds?/:interval?/:period?",
    checkOnboarding,
  function(ctx) {
    var q = Actions.cleanFilterStrJSON(
      getJSONQuery(ctx)
    ) as Actions.FilterListJSON;
    q.labels = Actions.cleanListSelectJSON(q.labels);

    var teamId = Actions.cleanTeamId(ctx.params["teamId"]);
    var interval = Actions.cleanInterval(ctx.params["interval"], "month");
    var period = Actions.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderFilterList({
      cals: Actions.cleanCalSelections(teamId, ctx.params["calIds"]),
      period: period
    }, q)
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
