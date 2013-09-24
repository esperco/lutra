/*
  Login and team management
*/

var login = (function() {
  var mod = {};

  mod.pretendLogin = function () {
    var login = {
      uid: sample.robin.profile_uid,
      team: sample.team_lonsdale,
      teams: [sample.team_lonsdale],
      api_secret: "d08dec3a355773409da117b739eb4d37"
    };

    localStorage.login = login; // Persistent storage never sent to the server
    mod.data = login;
  }

  /*
    Get API secret from the server.
  */
  mod.login = function (email, password, onSuccess) {
    pretendLogin(); // TODO get api_secret from server instead
    onSuccess();
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
