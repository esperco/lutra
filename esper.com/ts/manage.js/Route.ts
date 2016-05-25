/*
  esper.com/manage routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  var onboardingCheck: PageJS.Callback = function(ctx, next) {
    if (Stores.Teams.all().length) {
      next();
    } else {
      Route.nav.go(Paths.Manage.newTeam())
    }
  }

  routeHome(
    redirectPath(Paths.Manage.general())
  );

  route(Paths.Manage.newTeam().hash, function() {
    Actions.renderNewTeam();
  });

  route(Paths.Manage.newGroup().hash, function() {
    Actions.renderNewGroup();
  });

  route(Paths.Manage.general({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderGeneralSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.calendars({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderCalendarSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.labels({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderLabelSettings(ctx.params["teamId"], msg, err);
    });

  route(Paths.Manage.notifications({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      var msg = Util.getParamByName("msg", ctx.querystring);
      var err = Util.getParamByName("err", ctx.querystring);
      Actions.renderNotificationSettings(ctx.params["teamId"], msg, err);
    });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
