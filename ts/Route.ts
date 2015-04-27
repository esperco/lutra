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

  var Router = window["can"].Control({ // FIXME
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(Page.settings.load);
    },

    /* Generic invitation */
    "t/:token route" : function(data) {
      if (isIOS()) {
        openIOSapp(data.token, undefined, undefined);
      } else {
        withLogin(Page.settings.load, undefined, data.token, undefined);
      }
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
      if (isIOS() && data.hex_landing_url.length == 0) {
        fallbackOnAppStore();
        window.location.href = "esper:login1/" + data.uid;
      } else {
        Signin.loginOnce(data.uid, Util.hexDecode(data.hex_landing_url));
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

    "join/:teamid route" : function (data) {
      withLogin(Page.onboarding.load, [data.teamid]);
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
