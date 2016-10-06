/*
  esper.com/manage routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  var demoCheck: PageJS.Callback = function(ctx, next) {
    if (Login.data.is_sandbox_user) {
      Route.nav.go(Paths.Manage.sandbox());
    } else {
      next();
    }
  }

  // Check if we have a team -- implies demo check
  var onboardingCheck: PageJS.Callback = function(ctx, next) {
    demoCheck(ctx, function() {
      if (Stores.Teams.all().length) {
        next();
      } else {
        Route.nav.go(Paths.Manage.newTeam());
      }
    });
  }

  // Check if we have a group -- implies demo check
  var groupCheck: PageJS.Callback = function(ctx, next) {
    demoCheck(ctx, function() {
      if (Stores.Groups.all().length) {
        next();
      } else {
        Route.nav.go(Paths.Manage.newGroup());
      }
    });
  }

  routeHome(
    redirectPath(Paths.Manage.Team.general())
  );

  route(Paths.Manage.newTeam().hash, demoCheck, function() {
    Actions.renderNewTeam();
  });

  route(Paths.Manage.newGroup().hash, demoCheck, function() {
    Actions.renderNewGroup();
  });

  route(Paths.Manage.Team.general({teamId: ":teamId?"}).hash,
    onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderTeamGeneralSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.Team.calendars({teamId: ":teamId?"}).hash,
    onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderCalendarSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.Team.labels({teamId: ":teamId?"}).hash,
    onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderTeamLabelSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.Team.notifications({teamId: ":teamId?"}).hash,
    onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderTeamNotificationSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.Team.pay({teamId: ":teamId?"}).hash,
    onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderTeamPaySettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.personal().hash, demoCheck, function(ctx) {
    Actions.renderPersonalSettings();
  });

  route(Paths.Manage.Group.general({groupId: ":groupId?"}).hash, groupCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderGroupGeneralSettings(ctx.params["groupId"], msg, err);
  });

  route(Paths.Manage.Group.labels({groupId: ":groupId?"}).hash, groupCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderGroupLabelSettings(ctx.params["groupId"], msg, err);
  });

  route(Paths.Manage.Group.notifications({groupId: ":groupId?"}).hash,
    groupCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderGroupNotificationSettings(ctx.params["groupId"], msg, err);
  });

  route(Paths.Manage.newCustomer().hash,
    demoCheck,
    function(ctx) {
      Actions.renderNewCustomer();
    });

  route(Paths.Manage.Customer.general({custId: ":custId?"}).hash,
    demoCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderCustomerGeneralSettings(ctx.params["custId"], msg, err);
    });

  route(Paths.Manage.Customer.accounts({custId: ":custId?"}).hash,
    demoCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderCustomerAccountsSettings(ctx.params["custId"], msg, err);
    });

  route(Paths.Manage.Customer.pay({custId: ":custId?"}).hash,
    demoCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderCustomerPaySettings(ctx.params["custId"], msg, err);
    });

  route(Paths.Manage.sandbox().hash, Actions.renderSandbox);

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
