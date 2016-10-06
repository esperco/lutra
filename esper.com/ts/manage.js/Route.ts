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

  route(Paths.Manage.newCustomer().hash, demoCheck, function(ctx) {
    Actions.renderNewCustomer();
  });

  function routeTeam(
    pathFn: (x: {teamId?: string}) => Paths.Path,
    cb: (x: {teamId: string, msg?: string, err?: string}) => void
  ) {
    route(pathFn({teamId: ":teamId?"}).hash,
      onboardingCheck,
      function(ctx) {
        let teamId = Params.cleanTeamId(ctx.params["teamId"])
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({teamId, msg, err});
      }
    )
  }

  routeTeam(Paths.Manage.Team.general, Actions.renderTeamGeneralSettings);
  routeTeam(Paths.Manage.Team.calendars, Actions.renderCalendarSettings);
  routeTeam(Paths.Manage.Team.labels, Actions.renderTeamLabelSettings);
  routeTeam(Paths.Manage.Team.notifications,
            Actions.renderTeamNotificationSettings);
  routeTeam(Paths.Manage.Team.pay, Actions.renderTeamPaySettings);

  route(Paths.Manage.personal().hash, demoCheck, function(ctx) {
    Actions.renderPersonalSettings();
  });


  function routeGroup(
    pathFn: (x: {groupId?: string}) => Paths.Path,
    cb: (x: {groupId: string, msg?: string, err?: string}) => void
  ) {
    route(pathFn({groupId: ":groupId?"}).hash,
      groupCheck,
      function(ctx) {
        let groupId = Params.cleanGroupId(ctx.params["groupId"])
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({groupId, msg, err});
      }
    )
  }

  routeGroup(Paths.Manage.Group.general, Actions.renderGroupGeneralSettings);
  routeGroup(Paths.Manage.Group.labels, Actions.renderGroupLabelSettings);
  routeGroup(Paths.Manage.Group.notifications,
             Actions.renderGroupNotificationSettings);


  function routeCustomer(
    pathFn: (x: {cusId?: string}) => Paths.Path,
    cb: (x: {cusId: string, msg?: string, err?: string}) => void
  ) {
    route(pathFn({cusId: ":cusId?"}).hash,
      demoCheck,
      function(ctx) {
        let cusId = Params.cleanCustomerId(ctx.params["cusId"])
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({cusId, msg, err});
      }
    )
  }

  routeCustomer(Paths.Manage.Customer.general,
                Actions.renderCustomerGeneralSettings);
  routeCustomer(Paths.Manage.Customer.accounts,
                Actions.renderCustomerAccountsSettings);
  routeCustomer(Paths.Manage.Customer.pay,
                Actions.renderCustomerPaySettings);


  route(Paths.Manage.sandbox().hash, Actions.renderSandbox);

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
