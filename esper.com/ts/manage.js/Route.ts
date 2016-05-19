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

  route(Paths.Manage.general({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      Actions.renderGeneralSettings(ctx.params["teamId"]);
    });

  route(Paths.Manage.calendars({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      Actions.renderCalendarSettings(ctx.params["teamId"]);
    });

  route(Paths.Manage.labels({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      Actions.renderLabelSettings(ctx.params["teamId"]);
    });

  route(Paths.Manage.notifications({teamId: ":teamId?"}).hash, onboardingCheck,
    function(ctx) {
      Actions.renderNotificationSettings(ctx.params["teamId"]);
    });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
