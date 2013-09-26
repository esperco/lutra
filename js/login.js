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
    // Persistent storage never sent to the server
    cache.set("login", login);
    util.log(login);
    util.log(cache.get("login").uid);
    mod.data = login;
  }

  /*
    Get API secret from the server.
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
  mod.setHttpHeaders = function(jqXHR) {
    var unixTime = Math.round(+new Date()/1000).toString();
    //var path = jqXHR.url.match(/\/\/[^\/]*(\/.*)/)[1];
    var path = jqXHR.url;
    var signature = CryptoJS.SHA1(
      unixTime
        + ","
        + path
        + ","
        + mod.data.api_secret
    );
    jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
    jqXHR.setRequestHeader("Esper-Signature", signature);
  }

  return mod;
})();
