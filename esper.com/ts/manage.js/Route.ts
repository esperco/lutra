/*
  esper.com/manage routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  routeHome(
    redirectHash(
      Paths.Manage.team().hash
    )
  );

  route(Paths.Manage.newTeam().hash, function() {
    // TODO
  });

  route(Paths.Manage.team({teamId: ":teamId?"}).hash, function(ctx) {
    Actions.renderTeamSettings(ctx.params["teamId"]);
  });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });

}
