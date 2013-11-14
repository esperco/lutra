/* Do the right thing based on the URL */

var route = (function() {

  var mod = {};
  mod.nav = {};

  function withLogin(f) {
    if (!login.data)
      location.hash = "#!login/redir/" + encodeURIComponent(location.hash);
    else
      f ();
  }

  var Router = can.Control({
    init : function(el, options) {
    },

    /* default path /!# */
    "route" : function(data){
      withLogin(page.home.load);
    },

    /* login, logout, etc. */
    "login route" : function(data) {
      page.login.load("");
    },
    "logout route" : function(data) {
      login.logout();
      mod.nav.login();
    },
    "login/redir/:redir route" : function(data) {
      page.login.load(data.redir);
    },

    /* various pages */

    "task route": function(data) {
      withLogin(function () { page.task.load(data); });
    },

    "respond/:rid/:uid route" : function(data) {
      withLogin(function () { page.respond.load(rid, asUid); });
    },

    "translate/response/:rid/:uid route" : function(data) {
      withLogin(function () { log(data); });
    }
  });

  /* Navigation functions (set the URL, let the router react to the changes) */

  /* e.g. route.nav.path("#!a/b/c") goes to URL /#!a/b/c  */
  mod.nav.path = function(frag) {
    location.hash = frag;
  }

  mod.nav.home = function() {
    location.hash = "#!";
  }

  mod.nav.login = function() {
    location.hash = "#!login";
  }

  mod.nav.logout = function() {
    location.hash = "#!logout";
  }

  mod.nav.respond = function(rid, uid) {
    location.hash = "#!respond/" + rid + "/" + uid;
  }

  mod.nav.translateResponse = function(rid, uid) {
    location.hash = "#!translate/response/" + rid + "/" + uid;
  }

  /* Initialization */
  mod.setup = function() {
    var router = new Router(window);
    can.route.ready();
  }

  return mod;
}());
