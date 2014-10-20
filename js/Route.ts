/* Do the right thing based on the URL */
module Route {

  export var nav : any = {}; // FIXME

  function withLogin(whenDone, optInviteCode, optEmail) {
    Signin.signin(whenDone, optInviteCode, optEmail);
  }

  var Router = window["can"].Control({ // FIXME
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(Page.settings.load, undefined, undefined);
    },

    /* Generic invitation */
    "t/:token route" : function(data) {
      withLogin(Page.settings.load, data.token, undefined);
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url route" : function(data) {
      Signin.loginOnce(data.uid, Util.hexDecode(data.hex_landing_url));
    },

    "login/:email route" : function(data) {
      withLogin(function() { window.close(); }, undefined, data.email);
    },

    /* various pages */

    "preferences route" : function (data) {
      withLogin(Page.preferences.load, undefined, undefined);
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
