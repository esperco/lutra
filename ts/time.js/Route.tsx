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

  // Helper to check whether user is active (in Stripe)
  function checkActive(teamId: string, next: () => any) {
    teamId = Params.cleanTeamId(teamId);
    let team = Stores.Teams.require(teamId);
    if (team) {
      next();

      // Disable subscription checking code (shutdown)
      // 
      // let teamSub = team.team_api.team_subscription;
      // if (teamSub.active) {
      //   next(); return;
      // }

      // // No status => no plan => subscribe to default + start free trial
      // else if (! teamSub.status) {
      //   Actions.Subscriptions.set({
      //     cusId: teamSub.cusid,
      //     planId: Config.DEFAULT_PLAN
      //   });
      //   next();
      // }

      // // Else, has bad status (need payment)
      // else {
      //   Route.nav.go(Paths.Time.paymentInfo({ teamId }));
      // }
    }
  }

  // Helper to check whether user is active AND has a card
  function checkHasCard(teamId: string, next: () => any) {
    checkActive(teamId, function() {
      teamId = Params.cleanTeamId(teamId);
      let team = Stores.Teams.require(teamId);
      next();

      // Ignore card status (shutdown)
      // let teamSub = team.team_api.team_subscription;
      // if (teamSub.valid_payment_source) {
      //   next();
      // } else {
      //   Route.nav.go(Paths.Time.paymentInfo({ teamId }));
      // }
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

  routeHome(
    redirectPath(Paths.Time.report())
  );

  // Reports / All-the-Charts page
  route(Paths.Time.report({
    teamId: ":teamId?",
    interval: ":interval?",
    period: ":period?"
  }).hash, checkOnboarding,
  function(ctx, next) { checkActive(ctx.params["teamId"], next); },
  function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    var interval = Params.cleanInterval(ctx.params["interval"], "week");
    var period = Params.cleanPeriod(interval, ctx.params["period"]);
    Actions.renderReport({
      teamId: teamId,
      period: period,
      extra: getJSONQuery(ctx)
    });

    // Set feature flag for charts
    Actions.FeatureFlags.set({ team_charts: true });
  });


  // Charts

  /*
    Generic cleaning + routing function for our chart functions
  */
  function routeChart(
    pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path,
    cbFn: (o: Types.ChartParams) => void
  ) {
    route(pathFn({
      teamId: ":teamId?",
      calIds: ":calIds?",
      interval: ":interval?",
      period: ":period?"
    }).hash, checkOnboarding,

    // Require active status for charts page
    function(ctx, next) { checkHasCard(ctx.params["teamId"], next); },

    // Actual chart page
    function(ctx) {
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


  function routeList(
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

  routeList(Paths.Time.listWeek, Actions.renderWeek);
  routeList(Paths.Time.listMonth, Actions.renderMonth);
  routeList(Paths.Time.listAgenda, Actions.renderAgenda);
  routeList(Paths.Time.list, Actions.renderAgenda); // Default


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
  }).hash, checkOnboarding, function(ctx) {
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    Actions.renderPaymentInfo({teamId});
  });

  /////

  // Redirect stupid Techcrunch link
  route("/labels-over-time",
    redirectPath(Paths.Time.charts())
  );

  // Redirect old settings pages
  route("/labels", redirectPath(Paths.Manage.Team.labels()));
  route("/calendar-manage", redirectPath(Paths.Manage.Team.calendars()));

  // Redirect old post-meeting feedback links
  route("/event", redirectPath(Paths.Now.event({})));

  // Redirect old charts to new
  route("/charts/:chartId?/:teamId?/:calIds?/:interval?/:period?",
    redirectPath(Paths.Time.charts()));

  // Redirect old unconfirmed link
  route("/list-new/:teamId?/:calIds?/:interval?/:period?",
    redirectPath(Paths.Time.report()));

  // Redirect old calendar labeling page
  route("/calendar-labeling/:teamId?/:calIds?/:interval?/:period?",
    redirectPath(Paths.Time.list()));

  // 404 page
  routeNotFound(function(ctx) {
    Actions.render(<Views.NotFound />);
  });
}
