/*
  esper.com/today routes go here
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

  routeHome(function(ctx) {
    Actions.renderCurrent();
  });

  route(Paths.Now.event().hash, function(ctx) {
    var q = decodeURIComponent(ctx.querystring);
    /* ctx.querystring does not really contain the query of the URL.
       It is just the part of the fragment identifier after '?', i.e.,
         .../time#!/...?{ctx.querystring}
       so we need an explicit url-decoding here for the '&' separators.
     */
    Actions.renderEvent({
      teamId  : Util.getParamByName("team",   q),
      calId   : Util.getParamByName("cal",    q),
      eventId : Util.getParamByName("event",  q),
      action  : Util.getParamByName("action", q)
    });
  });

  route(Paths.Now.date({ date: ":date", teamId: ":teamId?" }).hash,
  function(ctx) {
    var date = moment(ctx.params["date"], "YYYY-MM-DD").toDate();
    var teamId = Params.cleanTeamId(ctx.params["teamId"]);
    Actions.renderDatePage(date, teamId);
  });

  routeNotFound(function(ctx) {
    Actions.render(React.createElement(Views.NotFound, {}));
  });
}
