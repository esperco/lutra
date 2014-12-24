/* Do the right thing based on the URL */
module Route {

  export var nav : any = {}; // FIXME

  function withLogin(whenDone,
                     optArgs?,
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
      withLogin(Page.settings.load, undefined, data.token, undefined);
    },

    /* Gift code (same a generic invitation but collect also
       an email address and a name */
    "redeem/:token/:email/:name route" : function(data) {
      withLogin(Page.settings.load, undefined,
                data.token, data.email, data.name);
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url route" : function(data) {
      Signin.loginOnce(data.uid, Util.hexDecode(data.hex_landing_url));
    },

    "login/:email route" : function(data) {
      var close = function() { window.close(); };
      withLogin(close, undefined, undefined, data.email);
    },

    /* various pages */

    "team-settings/:teamid route" : function (data) {
      withLogin(Page.teamSettings.load, data.teamid, undefined, undefined);
    },

    "preferences route" : function (data) {
      withLogin(Page.preferences.load);
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
