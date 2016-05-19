/*
  esper.com/manage routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  routeHome(
    redirectPath(Paths.Manage.general())
  );

  route(Paths.Manage.newTeam().hash, function() {
    // TODO
  });

  route(Paths.Manage.general({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderGeneralSettings(ctx.params["teamId"]);
  });

  route(Paths.Manage.calendars({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderCalendarSettings(ctx.params["teamId"]);
  });

  route(Paths.Manage.labels({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderLabelSettings(ctx.params["teamId"]);
  });

  route(Paths.Manage.notifications({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderNotificationSettings(ctx.params["teamId"]);
  });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
