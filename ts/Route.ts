/* Do the right thing based on the URL */
module Route {

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

  function withLogin(whenDone,
                     optArgs?: any[],
                     optInviteCode?: string,
                     optEmail?: string,
                     optName?: string) {
    Signin.signin(whenDone, optArgs, optInviteCode, optEmail, optName);
  }

  function gotToken(token) {
    if (isIOS()) {
      openIOSapp(token, undefined, undefined);
    } else {
      withLogin(Page.settings.load, undefined, token, undefined);
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

    /* Gift code (same as generic invitation but collect also
       an email address and a name */
    "redeem/:token/:email/:name/:platform route" : function(data) {
      Log.d(data);
      if (isIOS()) {
        openIOSapp(data.token, data.email, data.name);
      } else if (data.platform !== "Google Apps") {
        var msg = $("<p>Thank you for signing up! We're currently working on " +
                    "support for " + data.platform + ". We'll be in touch as " +
                    "soon as we're ready!</p>");
        msg.addClass("sign-in");
        $(document.body).children().remove();
        $(document.body).append(msg);
      } else {
        withLogin(Page.settings.load, undefined,
                  data.token, data.email, data.name);
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
      withLogin(close, undefined, undefined, data.email);
    },

    /* various pages */

    "team-settings/:teamid route" : function (data) {
      withLogin(Page.teamSettings.load, data.teamid);
    },

    // Intentionally not requiring login for this
    "join route": function (data) {
      Page.onboarding.load();
    },

    "join-from-login route": function (data) {
      Page.onboarding.load(0, {fromLogin: true});
    },

    "join/:step route" : function (data) {
      let step = parseInt(data.step) || 0;
      if (step) {
        withLogin(Page.onboarding.load, [step]);
      } else {
        Page.onboarding.load();
      }
    },

    "plans/:teamid route" : function (data) {
      withLogin(Page.plans.load, data.teamid);
    },

    "payment/:teamid route" : function (data) {
      withLogin(Page.payment.load, data.teamid);
    },

    // superseded by "signup2/..." below
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
      withLogin(Page.usagePeriod.load, [data.teamid, data.start]);
    },

    "test route": function(data) {
      Page.test.load();
    },

  });

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("#!a/b/c") goes to URL /#!a/b/c  */
  nav.path = function(frag) {
    location.hash = frag;
  };

  nav.home = function() {
    location.hash = "#!";
  };

  /* Initialization */
  export function setup() {
    var router = new Router(window);
    window["can"].route.ready(); // FIXME
  };

}
