/*
  Login and team management
*/

var login = (function() {
  var mod = {};
  mod.data = {};

  mod.initLoginInfo = function() {
    var stored = store.get("login");

    if (stored && stored.uid) // sanity check
      mod.data = stored;
    else
      store.remove("login");
    mod.updateView();
  };

  mod.setLoginInfo = function(stored) {
    if (flags.isProduction) {
      mixpanel.register({uid: stored.uid}); // Sent with every track()
      mixpanel.track("Login");
    }

    if (!util.isDefined(stored.team) && util.isDefined(stored.teams[0]))
      stored.team = stored.teams[0];

    // Persistent storage never sent to the server
    store.set("login", stored);
    mod.data = stored;
    mod.updateView();
  };

  function saveLoginInfo() {
    var stored = mod.data;
    store.set("login", stored);
  }

  mod.clearLoginInfo = function() {
    store.remove("login");
    delete mod.data;
    $("#login-email").val("");
    $("#login-password").val("");
    mod.updateView();
  };

  /*
    Get API secret from the server, and more.
  */
  mod.login = function (email, password) {
    return api.login(email, password)
      .then(mod.setLoginInfo,
            status_.onError(400));
  };

  mod.logout = function () {
    mp.track("Logout");
    mod.clearLoginInfo();
    header.clear();
  };

  /*
    Set HTTP headers for authentication, assuming the user is logged in.

    The advantages over sending the api_secret as a cookie are:
    - the secret is not sent to the server
    - the signature expires, preventing replay attacks
    - all clients use the same mechanism
  */
  mod.setHttpHeaders = function(path) {
    return function(jqXHR) {
      if (mod.data) {
        var unixTime = Math.round(+new Date()/1000).toString();
        var signature = CryptoJS.SHA1(
          unixTime
            + ","
            + path
            + ","
            + mod.data.api_secret
        );
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);
      }
    }
  };

  mod.updateView = function() {
    if (mod.data && mod.data.email) {
      $("#logged-in-email").text(mod.data.email);
      $(".logged-out").addClass("hide");
      $(".logged-in").removeClass("hide");
      pusher.start();
    } else {
      $(".logged-in").addClass("hide");
      $(".logged-out").removeClass("hide");
      pusher.stop();
    }
  };

  /* Utilities */
  mod.me = function() {
    if (util.isDefined(mod.data))
      return mod.data.uid;
    else
      return;
  };

  mod.myEmail = function() {
    if (util.isDefined(mod.data))
      return mod.data.email;
    else
      return;
  };

  mod.getTeams = function() {
    if (util.isDefined(mod.data))
      return mod.data.teams;
    else
      return [];
  };

  mod.getTeam = function() {
    if (util.isDefined(mod.data))
      return mod.data.team;
  };

  mod.setTeam = function(team) {
    mod.data.team = team;
    saveLoginInfo();
  };

  mod.organizers = function() {
    return mod.getTeam().team_organizers;
  };

  mod.leader = function() {
    return mod.getTeam().team_executive;
  };

  return mod;
})();
