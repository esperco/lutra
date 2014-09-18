/* Do the right thing based on the URL */
console.log("Whoo");
var route = (function() {

  var mod = {};
  mod.nav = {};

  function withLogin(whenDone, optInviteCode, optEmail) {
    signin.signin(whenDone, optInviteCode, optEmail);
  }

  var Router = can.Control({
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(page.settings.load);
    },

    /* Generic invitation */
    "t/:token route" : function(data) {
      withLogin(page.settings.load, data.token);
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url route" : function(data) {
      signin.loginOnce(data.uid, util.hexDecode(data.hex_landing_url));
    },

    "login/:email route" : function(data) {
      withLogin(function() { window.close(); }, undefined, data.email);
    },

    /* various pages */

    "preferences" : function (data) {
      console.log("Preferences!");
      withLogin(function () { });
    },

    "test route": function(data) {
      page.test.load();
    },

  });

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("#!a/b/c") goes to URL /#!a/b/c  */
  mod.nav.path = function(frag) {
    location.hash = frag;
  };

  mod.nav.home = function() {
    location.hash = "#!";
  };

  /* Initialization */
  mod.setup = function() {
    var router = new Router(window);
    can.route.ready();
  };

  return mod;
}());
