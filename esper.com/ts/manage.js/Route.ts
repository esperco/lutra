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

  /* Render pages that require pathFn to be passed to it */

  function routeSettings(pathFn: () => Paths.Path,
                         cb: (x: {
                           msg?: string;
                           err?: string;
                           pathFn: () => Paths.Path;
                         }) => void)
  {
    route(pathFn().hash, demoCheck, function(ctx) {
      let msgCode = Util.getParamByName("msg", ctx.querystring);
      let msg = ManageMsg.get(msgCode);
      let errCode = Util.getParamByName("err", ctx.querystring);
      let err = ManageMsg.get(errCode);
      cb({ pathFn, msg, err });
    });
  }

  routeSettings(Paths.Manage.newTeam, Actions.renderNewTeam);
  routeSettings(Paths.Manage.newGroup, Actions.renderNewGroup);
  routeSettings(Paths.Manage.newCustomer, Actions.renderNewCustomer);
  routeSettings(Paths.Manage.personal, Actions.renderPersonalSettings);


  /* Render team-specific setting pages */

  function routeTeam(
    pathFn: (x: {teamId?: string}) => Paths.Path,
    cb: (x: {
      teamId: string,
      pathFn: (x: {teamId?: string}) => Paths.Path,
      msg?: string,
      err?: string
    }) => void
  ) {
    route(pathFn({teamId: ":teamId?"}).hash,
      onboardingCheck,
      function(ctx) {
        let teamId = Params.cleanTeamId(ctx.params["teamId"])
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({teamId, pathFn, msg, err});
      }
    )
  }

  routeTeam(Paths.Manage.Team.general, Actions.renderTeamGeneralSettings);
  routeTeam(Paths.Manage.Team.calendars, Actions.renderTeamCalendarSettings);
  routeTeam(Paths.Manage.Team.labels, Actions.renderTeamLabelSettings);
  routeTeam(Paths.Manage.Team.notifications,
            Actions.renderTeamNotificationSettings);
  routeTeam(Paths.Manage.Team.pay, Actions.renderTeamPaySettings);
  routeTeam(Paths.Manage.Team.exportCSV, Actions.renderTeamExport);
  route(Paths.Manage.Team.base().hash,
        redirectPath(Paths.Manage.Team.general()));


  /* Render group-specifi settings pages */

  function routeGroup(
    pathFn: (x: {groupId?: string}) => Paths.Path,
    cb: (x: {
      groupId: string,
      pathFn: (x: {groupId?: string}) => Paths.Path,
      msg?: string,
      err?: string
    }) => void
  ) {
    route(pathFn({groupId: ":groupId?"}).hash,
      groupCheck,
      function(ctx) {
        let groupId = Params.cleanGroupId(ctx.params["groupId"])
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({groupId, pathFn, msg, err});
      }
    )
  }

  routeGroup(Paths.Manage.Group.general, Actions.renderGroupGeneralSettings);
  routeGroup(Paths.Manage.Group.labels, Actions.renderGroupLabelSettings);
  routeGroup(Paths.Manage.Group.notifications,
             Actions.renderGroupNotificationSettings);
  route(Paths.Manage.Group.base().hash,
        redirectPath(Paths.Manage.Group.general()));


  /* Render customer-specific settings pages */

  function routeCustomer(
    pathFn: (x: {cusId?: string}) => Paths.Path,
    cb: (x: {
      cusId: string,
      pathFn: (x: {cusId?: string}) => Paths.Path,
      msg?: string,
      err?: string
    }) => void
  ) {
    route(pathFn({cusId: ":cusId?"}).hash,
      demoCheck,

      // Make sure the logged in user matches the email parameter
      function(ctx, next) {
        let cusEmail = Util.getParamByName("email", ctx.querystring);
        if (_.isEmpty(cusEmail) || Login.myEmail() === cusEmail) next();
        else Actions.renderErrorPage(Text.wrongCustomerEmail(cusEmail));
      },

      // Make sure customer has default plan
      function(ctx, next) {
        let cusId = Params.cleanCustomerId(ctx.params["cusId"]);
        Stores.Customers.getLoadPromise().done(function() {
          let cust = Stores.Customers.require(cusId);
          if (! cust.subscription.plan) {
            // Set default plan for enterprise users
            if (! cust.teamid) {
              Actions.Subscriptions.set({
                cusId, planId: Config.DEFAULT_ENTERPRISE_PLAN
              }).then(() => next());
            }
          } else {
            next();
          }
        });
      },

      // Actual view
      function(ctx) {
        let cusId = Params.cleanCustomerId(ctx.params["cusId"]);
        let msgCode = Util.getParamByName("msg", ctx.querystring);
        let msg = ManageMsg.get(msgCode);
        let errCode = Util.getParamByName("err", ctx.querystring);
        let err = ManageMsg.get(errCode);
        cb({cusId, pathFn, msg, err});
      }
    )
  }

  routeCustomer(Paths.Manage.Customer.general,
                Actions.renderCustomerGeneralSettings);
  routeCustomer(Paths.Manage.Customer.accounts,
                Actions.renderCustomerAccountsSettings);
  routeCustomer(Paths.Manage.Customer.pay,
                Actions.renderCustomerPaySettings);


  /* Misc */

  route(Paths.Manage.sandbox().hash, Actions.renderSandbox);

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
