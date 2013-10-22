/* Do the right thing based on the URL */

var route = (function() {

  var mod = {};
  mod.nav = {};

  function withLogin(f) {
    log(location.hash);
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
      withLogin(pageHome);
    },

    /* login, logout, etc. */
    "login route" : function(data) {
      pageLogin("");
    },
    "logout route" : function(data) {
      login.logout();
      mod.nav.login();
    },
    "login/redir/:redir route" : function(data) {
      log(data);
      login.logout(); // hack - we shouldn't do that
      pageLogin(data.redir);
    },

    /* various pages */
    "respond/:rid/:uid route" : function(data) {
      withLogin(function () { log(data); });
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
