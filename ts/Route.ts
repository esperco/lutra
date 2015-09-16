/* Do the right thing based on the URL */
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
    Onboarding.checkStatus
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
    Signin.signin(callback, optInviteCode, optEmail);
  }

  function gotToken(token) {
    if (isIOS()) {
      openIOSapp(token, undefined, undefined);
    } else {
      withLogin(Page.settings.load, token, undefined);
    }
  }

  var Router = window["can"].Control({ // FIXME
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(Page.settings.load);
    },

    /* Generic invitation */
    "t/:token route" : function(data) {
      gotToken(data.token);
    },

    /* DEPRECATED - Use signup2 instead.
       Gift code (same as generic invitation but collect also
       an email address and a name. */
    "redeem/:token/:email/:name/:platform route" : function(data) {
      Log.d(data);
      if (isIOS()) {
        openIOSapp(data.token, data.email, data.name);
      } else {
        withLogin(Page.settings.load, data.token, data.email);
      }
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url route" : function(data) {
      var landing_url = Util.hexDecode(data.hex_landing_url);
      if (isIOS() && landing_url == "esper:login1") {
        fallbackOnAppStore();
        window.location.href = "esper:login1/" + data.uid;
      } else {
        Signin.loginOnce(data.uid, landing_url);
      }
    },

    "login/:email route" : function(data) {
      var close = function() { window.close(); };
      withLogin(close, undefined, data.email);
    },

    /* various pages */

    "team-settings/:teamid route" : function (data) {
      withLogin(function() {
        Page.teamSettings.load(data.teamid);
      });
    },

    // Intentionally not requiring login for this
    "join route": function (data) {
      Page.onboarding.load();
    },

    "join-from-login route": function (data) {
      Page.onboarding.load(0, {fromLogin: true});
    },

    "join/exchange route": function (data) {
      Page.onboarding.load(0, {exchange: true});
    },

    "join/:step route" : function (data) {
      let step = parseInt(data.step) || 0;
      if (step) {
        withLogin(function() {
          Page.onboarding.load(step);
        });
      } else {
        Page.onboarding.load();
      }
    },

    "join/exchange/:step route" : function (data) {
      let step = parseInt(data.step) || 0;
      if (step) {
        withLogin(function() {
          Page.onboarding.load(step, {exchange: true});
        });
      } else {
        Page.onboarding.load(0, {exchange: true});
      }
    },

    "plans/:teamid route" : function (data) {
      withLogin(Page.plans.load, data.teamid);
    },

    "payment/:teamid route" : function (data) {
      withLogin(function() {
        Page.payment.load(data.teamid);
      });
    },

    // DEPRECATED - use signup2 or join instead
    "signup/:fn/:ln/:phone/:email/:platform route" : function (data) {
      var signup = {
        first_name: data.fn,
        last_name: data.ln,
        phone: data.phone,
        platform: data.platform
      };
      if (data.platform === "Google Apps") {
        Api.signup(data.email, signup).done(function() {
          Api.createOwnTeam().done(function(response) {
            window.location.assign(response.url);
          });
        });
      }
    },

    "signup2/:fn/:ln/:phone/:email/:platform/*:token? route" : function (data) {
      var signup = {
        first_name: data.fn,
        last_name: data.ln,
        phone: data.phone,
        platform: data.platform
      };
      if (data.platform === "Google Apps") {
        Api.signup(data.email, signup).done(function() {
          if (data.token && data.token.length > 0) {
            gotToken(data.token);
          } else {
            Api.createOwnTeam().done(function(response) {
              window.location.assign(response.url);
            });
          }
        });
      }
    },

    "preferences route" : function (data) {
      withLogin(Page.preferences.load);
    },

    "usage-period/:teamid/:start route" : function (data) {
      withLogin(function() {
        Page.usagePeriod.load(data.teamid, data.start);
      });
    },

    "test route": function(data) {
      Page.test.load();
    },

  });

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("#!a/b/c") goes to URL /#!a/b/c */
  nav.path = function(frag: string) {
    if (frag[0] === "!") {
      frag = "#" + frag;
    } else if (frag[0] !== "#") {
      frag = "#!" + frag;
    }
    location.hash = frag;
  };

  nav.home = function() {
    nav.path("#!");
  };

  /* Initialization */
  export function setup() {
    var router = new Router(window);
    window["can"].route.ready(); // FIXME
  };

}
