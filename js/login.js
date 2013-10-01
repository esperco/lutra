/*
  Login and team management
*/

var login = (function() {
  var mod = {};

  mod.initLoginInfo = function() {
    var login = cache.get("login");

    if (login && login.uid) // sanity check
      mod.data = login;
    else
      cache.remove("login");
  }

  mod.setLoginInfo = function(login) {
    if (login.teams[0])
      login.team = login.teams[0];

    // Persistent storage never sent to the server
    cache.set("login", login);
    mod.data = login;
  }

  mod.clearLoginInfo = function() {
    cache.remove("login");
    delete mod.data;
  }

  /*
    Get API secret from the server, and more.
  */
  mod.login = function (email, password, onSuccess) {
    function cont(login) {
      mod.setLoginInfo(login);
      onSuccess();
    }
    api.login(email, password, cont);
  }

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
  }

  return mod;
})();
