/* Do the right thing based on the URL */

var route = (function() {

  var mod = {};
  mod.nav = {};

  function withLogin(whenDone, optInviteCode) {
    signin.signin(whenDone, optInviteCode);
  }

  var Router = can.Control({
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(page.home.load);
    },

    /* Generic invitation */
    "t/:token route" : function(data) {
      withLogin(page.home.load, data.token);
    },

    /* Sign-in via Google */
    "login-once/:uid/:hex_landing_url route" : function(data) {
      signin.loginOnce(data.uid, util.hexDecode(data.hex_landing_url));
    },

    /* login, logout, etc. */
    "request-password route" : function() {
      page.requestPassword.load("");
    },
    "request-password/:email route" : function(data) {
      page.requestPassword.load(data.email);
    },
    "reset-password/:uid/:token route" : function(data) {
      page.resetPassword.load(data.uid, data.token);
    },
    "email-verify/:uid/:email/:token route" : function(data) {
      page.emailVerify.load(data.uid, data.email, data.token);
    },

    /* various pages */

    "test route": function(data) {
      page.test.load();
    },

    "task/:tid route": function(data) {
      withLogin(function () { page.task.load(data.tid); });
    },

    "respond/:rid/:uid route" : function(data) {
      withLogin(function () { page.respond.load(rid, asUid); });
    },

    "settings route" : function(data) {
      log("here");
      withLogin(function () { page.settings.load(); });
    },

    "translate/response/:rid/:uid route" : function(data) {
      withLogin(function () { });
    }
  });

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("#!a/b/c") goes to URL /#!a/b/c  */
  mod.nav.path = function(frag) {
    location.hash = frag;
  };

  mod.nav.home = function() {
    location.hash = "#!";
  };

  mod.nav.requestPassword = function(email) {
    location.hash = "#!request-password/" + email;
  };

  mod.nav.resetPassword = function(uid, token) {
    location.hash = "#!reset-password/" + uid + "/" + token;
  };

  mod.nav.respond = function(rid, uid) {
    location.hash = "#!respond/" + rid + "/" + uid;
  };

  mod.nav.settings = function() {
    location.hash = "#!settings";
  };

  mod.nav.translateResponse = function(rid, uid) {
    location.hash = "#!translate/response/" + rid + "/" + uid;
  };

  /* Initialization */
  mod.setup = function() {
    var router = new Router(window);
    can.route.ready();
  };

  return mod;
}());
