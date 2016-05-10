/// <reference path="../lib/Analytics.Web.ts" />
/// <reference path="../lib/Login.Web.ts" />
/// <reference path="../lib/Route.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Actions.tsx" />
/// <reference path="./Esper.ts" />

module Esper.Route {

  // Helper to require onboarding for certain pages
  var checkOnboarding: PageJS.Callback = function(ctx, next) {
    if (Onboarding.needsTeam()) {
      Route.nav.path("/team-setup");
    } else if (Onboarding.needsLabels()) {
      Route.nav.path("/label-setup");
    } else if (Onboarding.needsCalendars()) {
      Route.nav.path("/calendar-setup");
    } else {
      next();
    }
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

  // Redirect stupid Techcrunch link
  route("/labels-over-time", function(ctx) {
    nav.path("/charts");
  });

  // Charts
  route("/charts/:chartId?/:teamId?/:calIds?/:interval?/:period?",
    checkOnboarding,
  function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var calIds = Params.cleanCalIds(teamId, ctx.params["calIds"]);
    var interval = Params.cleanIntervalOrCustom(ctx.params["interval"],
                                                "week");
    var period = Params.cleanSingleOrCustomPeriod(interval,
                                                  ctx.params["period"]);
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
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var calIds = Params.cleanCalIds(teamId, ctx.params["calIds"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "month");
    var period = Params.cleanSinglePeriod(interval, ctx.params["period"]);
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
  route("/calendar-setup/:teamid?", function(ctx) {
    Actions.renderCalendarSetup(ctx.params["teamid"]);
  });

  // Temp page for managing calendars (until we get separate settings page)
  route("/calendar-manage/:teamid?", checkOnboarding, function(ctx) {
    Actions.renderCalendarManage(ctx.params["teamid"]);
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
    var q = Params.cleanFilterStrJSON(
      getJSONQuery(ctx)
    ) as Params.FilterListJSON;
    q.labels = Params.cleanListSelectJSON(q.labels);

    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "month");
    var period = Params.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderFilterList({
      cals: Params.cleanCalSelections(teamId, ctx.params["calIds"]),
      period: period
    }, q)
  });

  /* Onboarding */

  route("/team-setup", function(ctx) {
    Actions.renderTeamSetup();
  });

  route("/label-setup", function(ctx) {
    Actions.renderLabelSetup();
  });


  // 404 page
  route('*', function(ctx) {
    // To deal with weird issue where hrefs get too many slashes prepended.
    if (ctx.path.slice(0,2) === "//") {
      nav.path(ctx.path.slice(1));
    } else {
      Log.e(ctx);
      Actions.render(<Views.NotFound />);
    }
  });
}
