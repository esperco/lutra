/*
  esper.com/groups routes go here
*/

module Esper.Route {
  declare var pageJs: PageJS.Static;

  routeHome(
    redirectPath(Paths.Groups.list())
  );

  route(Paths.Groups.list().hash, function() {
    Actions.renderList();
  });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });
}
