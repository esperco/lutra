/*
  Do the right thing based on the URL.

  See https://visionmedia.github.io/page.js/ for details on Routing.
*/

/// <reference path="../common/Route.ts" />

module Esper.Route {
  var paths = {

    // Here to make backwards compatability simpler -- just redirects to
    // login page
    "login/:email" : function(data) {
      Login.extLogin(data.email);
    },

    /* various pages */

    "team-settings/:teamid/calendars": function(data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Calendars);
    },

    "team-settings/:teamid/preferences": function(data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Preferences);
    },

    "team-settings/:teamid/workflows": function(data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Workflows);
    },

    "team-settings/:teamid/labels": function(data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Labels);
    },

    "team-settings/:teamid/templates": function(data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Templates);
    },

    "team-settings/:teamid" : function (data) {
      Page.teamSettings.load(data.teamid, TeamSettings.View.Account);
    },

    "plans/:teamid" : function (data) {
      Page.plans.load(data.teamid);
    },

    "payment/:teamid" : function (data) {
      Page.payment.load(data.teamid);
    },

    "test": function(data) {
      Page.test.load();
    }
  };

  // Use pageJs to connect old paths in hash above to routing
  _.each(paths, function(callback: (data: any) => void, pathStr: string) {
    if (pathStr[0] !== "/") { pathStr = "/" + pathStr; }
    route(pathStr, function(context) {
      callback(context.params);
    });
  });

  // Home page -- distinguish between "#" (does nothing) and "#!" (home)
  var initLoad = true;
  route("", function(ctx) {
    if (initLoad || ctx.pathname.indexOf("!") >= 0) {
      initLoad = false;
      Page.settings.load();
    }
  });

  // Catch all
  pageJs("*", function(ctx) {
    // Correct random prefix errors
    if (ctx.path[0] !== "/") {
      pageJs.redirect("/" + ctx.path);
    } else if (ctx.path.slice(0,2) === "//") {
      pageJs.redirect(ctx.path.slice(1));
    } else {
      // 404
      Page.notFound.load();
      Log.e(ctx);
    }
  });
}
