/*
  Do the right thing based on the URL.

  See https://visionmedia.github.io/page.js/ for details on Routing.
*/

/// <reference path="../common/Route.ts" />

module Esper.Route {
  function isIOS() {
    var os = window.navigator.platform;
    return os === "iPhone" || os === "iPad" || os === "iPod";
  }

  function fallbackOnAppStore() {
    var appUrl = "https://itunes.apple.com/us/app/esper-executive-assistant/id969190370";
    // Go to App Store if we fail to open the app in half a second.
    window.setTimeout(function(){ window.location.href = appUrl; }, 500);
  }

  function openIOSapp(inviteCode: string,
                      optEmail?: string,
                      optName?: string) {
    var email = optEmail == undefined ? "" : optEmail;
    var name  = optName  == undefined ? "" : optName;

    fallbackOnAppStore();

    window.location.href = "esper:token/" + encodeURIComponent(inviteCode)
                         + "/" + encodeURIComponent(email)
                         + "/" + encodeURIComponent(name);
  }

  function gotToken(token) {
    if (isIOS()) {
      openIOSapp(token, undefined, undefined);
    } else {
      Page.token.load(token);
    }
  }

  var paths = {

    /* Generic invitations, unsubscription from emails, etc. */
    "t/:token" : function(data) {
      gotToken(data.token);
    },

    "login/:email" : function(data) {
      // TODO: Redirect
      // withLogin(undefined, undefined, data.email, "#!");
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
