/*
  Login and team management
*/

var login = (function() {
  var mod = {};

  mod.initLoginInfo = function() {
    var login = store.get("login");

    if (login && login.uid) // sanity check
      mod.data = login;
    else
      store.remove("login");
    mod.updateView();
  };

  mod.setLoginInfo = function(login) {
    if (login.teams[0])
      login.team = login.teams[0];

    // Persistent storage never sent to the server
    store.set("login", login);
    mod.data = login;
    mod.updateView();
  };

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
            status.onError(400));
  };

  mod.logout = function () {
    mod.clearLoginInfo();
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
    } else {
      $(".logged-in").addClass("hide");
      $(".logged-out").removeClass("hide");
    }
  };

  /* Utilities */
  mod.me = function() {
    return mod.data.uid;
  };

  mod.team = function() {
    return mod.data.teams[0];
  };

  mod.organizer = function() {
    return mod.team().team_organizers[0];
  };

  mod.leader = function() {
    return mod.team().team_leaders[0];
  };

  return mod;
})();
