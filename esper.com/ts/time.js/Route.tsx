/*
  esper.com/time routes go here
*/
module Esper.Route {

  // Helper to require onboarding for certain pages
  var checkOnboarding: PageJS.Callback = function(ctx, next) {
    if (Onboarding.needsTeam()) {
      Route.nav.go(Paths.Time.teamSetup());
    }

    // else if (Onboarding.needsLabels()) {
    //   Route.nav.go(Paths.Time.labelSetup());
    // } else if (Onboarding.needsCalendars()) {
    //   Route.nav.go(Paths.Time.calendarSetup());
    // }

    else {
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

  routeHome(
    redirectPath(Paths.Time.charts())
  );

  // Charts
  route(Paths.Time.charts({
    chartId: ":chartId?",
    teamId: ":teamId?",
    calIds: ":calIds?",
    interval: ":interval?",
    period: ":period?"
  }).hash, checkOnboarding, function(ctx) {
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
  route(Paths.Time.calendarLabeling({
    teamId: ":teamId?",
    calIds: ":calIds?",
    interval: ":interval?",
    period: ":period?"
  }).hash, checkOnboarding, function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var calIds = Params.cleanCalIds(teamId, ctx.params["calIds"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "month");
    var period = Params.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderCalendarLabeling(_.map(calIds, (calId) => ({
      teamId: teamId,
      calId: calId
    })), period);
  });

  // Event feedback landing page
  route(Paths.Time.event().hash, checkOnboarding, function(ctx) {
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

  route(Paths.Time.list({
    teamId: ":teamId?",
    calIds: ":calIds?",
    interval: ":interval?",
    period: ":period?"
  }).hash, checkOnboarding, function(ctx) {
    var q = Params.cleanFilterStrJSON(
      getJSONQuery(ctx)
    ) as Params.FilterListJSON;
    q.labels = Params.cleanListSelectJSON(q.labels);
    q.unconfirmed = Params.cleanBoolean(q.unconfirmed);

    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "month");
    var period = Params.cleanSinglePeriod(interval, ctx.params["period"]);
    Actions.renderFilterList({
      cals: Params.cleanCalSelections(teamId, ctx.params["calIds"]),
      period: period
    }, q)
  });

  // Alias for showing unconfirmed events only in list view
  route(Paths.Time.listNew({
    teamId: ":teamId?",
    calIds: ":calIds?",
    interval: ":interval?",
    period: ":period?"
  }).hash, function(ctx) {
    Route.nav.go(Paths.Time.list(ctx.params), {
      jsonQuery: {
        unconfirmed: true
      }
    });
  });


  /* Onboarding */

  route(Paths.Time.teamSetup().hash, function(ctx) {
    Actions.renderTeamSetup();
  });

  route(Paths.Time.calendarSetup({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderCalendarSetup(ctx.params["teamId"]);
  });

  route(Paths.Time.labelSetup({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderLabelSetup(ctx.params["teamId"]);
  });


  /////

  // Redirect stupid Techcrunch link
  route("/labels-over-time",
    redirectPath(Paths.Time.charts())
  );

  // Alias for old references to calendar-settings
  route("/calendar-settings", redirectPath(Paths.Manage.notifications()));
  route("/notification-settings", redirectPath(Paths.Manage.notifications()));

  // Redirect old settings pages
  route("/labels", redirectPath(Paths.Manage.labels()));
  route("/calendar-manage", redirectPath(Paths.Manage.calendars()));


  // 404 page
  routeNotFound(function(ctx) {
    Actions.render(<Views.NotFound />);
  });
}
