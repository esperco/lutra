/*
  Do the right thing based on the URL.

  See https://visionmedia.github.io/page.js/ for details on Routing.

*/
module Esper.Route {

  export var nav : any = {}; // FIXME

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

  // Post-login hooks, get run automatically after each withLogin call
  // Each hook must return true to proceed to the next
  var postLoginHooks: { (): boolean; }[] = [
    // Insert functions here
  ];

  function withLogin(whenDone,
                     optInviteCode?: string,
                     optEmail?: string) {
    // Wrap callback with any hooks
    function callback() {
      for (let i in postLoginHooks) {
        if (postLoginHooks.hasOwnProperty(i)) {
          if (! postLoginHooks[i]()) {
            return;
          }
        }
      }
      whenDone();
    }
    Signin.signin(callback, optEmail);
  }

  function gotToken(token) {
    if (isIOS()) {
      openIOSapp(token, undefined, undefined);
    } else {
      withLogin(Page.settings.load, token, undefined);
    }
  }

  var paths = {

    /* Generic invitation */
    "t/:token" : function(data) {
      gotToken(data.token);
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url" : function(data) {
      var landing_url = Util.hexDecode(data.hex_landing_url);
      if (isIOS() && landing_url == "esper:login1") {
        fallbackOnAppStore();
        window.location.href = "esper:login1/" + data.uid;
      } else {
        Signin.loginOnce(data.uid, landing_url);
      }
    },

    "login/:email" : function(data) {
      var close = function() { window.close(); };
      withLogin(close, undefined, data.email);
    },

    /* various pages */

    "team-settings/:teamid" : function (data) {
      withLogin(function() {
        Page.teamSettings.load(data.teamid);
      });
    },

    "plans/:teamid" : function (data) {
      withLogin(Page.plans.load, data.teamid);
    },

    "payment/:teamid" : function (data) {
      withLogin(function() {
        Page.payment.load(data.teamid);
      });
    },

    "preferences" : function (data) {
      withLogin(Page.preferences.load);
    },

    "usage-period/:teamid/:start" : function (data) {
      withLogin(function() {
        Page.usagePeriod.load(data.teamid, data.start);
      });
    },

    "settings": function(data) {
      withLogin(Page.settings.load);
    },

    "test": function(data) {
      Page.test.load();
    }
  };

  // Use pageJs to connect old paths in hash above to routing
  _.each(paths, function(callback: (data: any) => void, pathStr: string) {
    if (pathStr[0] !== "/") { pathStr = "/" + pathStr; }
    pageJs(pathStr, function(context) {
      callback(context.params);
    });
  });

  // Home page -- distinguish between "#" (does nothing) and "#!" (home)
  var init = true;
  pageJs("", function(ctx) {
    if (init || ctx.pathname.indexOf("!") >= 0) {
      init = false;
      pageJs.redirect("/settings");
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

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("a/b/c") goes to URL /#!/a/b/c */
  nav.path = function(frag: string) {
    if (frag[0] === "#") {
      frag = frag.slice(1);
    }
    if (frag[0] === "!") {
      frag = frag.slice(1);
    }
    if (frag[0] !== "/") {
      frag = "/" + frag;
    }
    pageJs(frag);
  };

  nav.home = function() {
    nav.path("");
  };

  /* Initialization */
  export function setup() {
    pageJs({
      click: false,
      hashbang: true
    });
  };

}
