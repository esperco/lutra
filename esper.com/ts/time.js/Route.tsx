/*
  esper.com/time routes go here
*/
module Esper.Route {

  // Helper to require onboarding for certain pages
  var checkOnboarding: PageJS.Callback = function(ctx, next) {
    if (Onboarding.needsTeam()) {
      Route.nav.go(Paths.Time.teamSetup());
    }

    else if (Onboarding.needsCalendars()) {
      Route.nav.go(Paths.Time.calendarSetup());
    }

    // else if (Onboarding.needsLabels()) {
    //   Route.nav.go(Paths.Time.labelSetup());
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
    redirectPath(Paths.Time.report())
  );

  // Reports / All-the-Charts page
  route(Paths.Time.report({
    teamId: ":teamId?",
    interval: ":interval?",
    period: ":period?"
  }).hash, checkOnboarding, function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "week");
    var period = Params.cleanPeriod(interval, ctx.params["period"]);
    Actions.renderReport({
      teamId: teamId,
      period: period,
      extra: getJSONQuery(ctx)
    });
  });


  // Charts

  /*
    Generic cleaning + routing function for our chart functions
  */
  function routeChart<T>(
    pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path,
    cbFn: (o: Types.ChartParams) => void
  ) {
    route(pathFn({
      teamId: ":teamId?",
      calIds: ":calIds?",
      interval: ":interval?",
      period: ":period?"
    }).hash, checkOnboarding, function(ctx) {
      var teamId = Params.cleanTeamId(ctx.params["teamId"]);
      var calIds = Params.cleanCalIds(teamId, ctx.params["calIds"]);
      var interval = Params.cleanInterval(ctx.params["interval"], "week");
      var period = Params.cleanPeriod(interval, ctx.params["period"]);

      // CalIds not in querystring but actual path (for now)
      var extra =  getJSONQuery(ctx) || {};
      extra.calIds = ctx.params["calIds"];

      cbFn({
        teamId: teamId,
        period: period,
        extra: Charting.cleanExtra(extra)
      });
    });
  }

  routeChart(Paths.Time.calendarsChart, Actions.Charts.renderCalendars);
  routeChart(Paths.Time.domainChart, Actions.Charts.renderDomains);
  routeChart(Paths.Time.durationsChart, Actions.Charts.renderDurations);
  routeChart(Paths.Time.guestsChart, Actions.Charts.renderGuests);
  routeChart(Paths.Time.guestsCountChart, Actions.Charts.renderGuestsCount);
  routeChart(Paths.Time.labelsChart, Actions.Charts.renderLabels);
  routeChart(Paths.Time.ratingsChart, Actions.Charts.renderRatings);

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
    var period = Params.cleanPeriod(interval, ctx.params["period"]);
    Actions.renderCalendarLabeling(_.map(calIds, (calId) => ({
      teamId: teamId,
      calId: calId
    })), period);
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
    var period = Params.cleanPeriod(interval, ctx.params["period"]);
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

  route(Paths.Time.calendarSetup().hash, function(ctx) {
    Actions.renderCalendarSetup();
  });

  route(Paths.Time.labelSetup().hash, function(ctx) {
    Actions.renderLabelSetup();
  });


  /* Payment */

  route(Paths.Time.paymentInfo({
    teamId: ":teamId?"
  }).hash, function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    Actions.renderPaymentInfo({teamId});
  });

  /////

  // Redirect stupid Techcrunch link
  route("/labels-over-time",
    redirectPath(Paths.Time.charts())
  );

  // Alias for old references to calendar-settings
  route("/calendar-settings",
    redirectPath(Paths.Manage.Team.notifications()));
  route("/notification-settings",
    redirectPath(Paths.Manage.Team.notifications()));

  // Redirect old settings pages
  route("/labels", redirectPath(Paths.Manage.Team.labels()));
  route("/calendar-manage", redirectPath(Paths.Manage.Team.calendars()));

  // Redirect old post-meeting feedback links
  route("/event", redirectPath(Paths.Now.event({})));

  // Redirect old charts to new
  route("/charts/:chartId?/:teamId?/:calIds?/:interval?/:period?",
    redirectPath(Paths.Time.charts()));

  // 404 page
  routeNotFound(function(ctx) {
    Actions.render(<Views.NotFound />);
  });
}
