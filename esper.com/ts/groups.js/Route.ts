/*
  esper.com/groups routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  var groupCheck: PageJS.Callback = function(ctx, next) {
    if (Stores.Groups.all().length) {
      next();
    } else {
      Route.nav.go(Paths.Manage.newGroup())
    }
  }

  routeHome(
    redirectPath(Paths.Groups.list())
  );

  route(Paths.Groups.list({groupId: ":groupId?"}).hash, groupCheck, function() {
    Actions.renderList();
  });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });
}
