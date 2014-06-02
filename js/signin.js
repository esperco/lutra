/*
  Whenever the page is loaded, before executing the code corresponding
  to the URL, the following must be checked:
  - user is logged in;
  - Esper has all the permissions it needs to access the Google services
    on behalf of the user;
  - user is member of at least one complete team (one executive, one assistant)

  The flow is as follows:

  0. user provides invite code?
     - yes:
        * check invite code, display what it's for, add invite code
          to login "state" passed to Google.
        * display "Google sign-in" button (goes to 2)
     - no: go to 1

  1. user has api_secret (login cookie)?
     - yes: check api_secret validity, go to 2
     - no:
         * display "Google sign-in" button (goes to 2)

  2. server has a valid Google token for all the scopes?
     - yes: go to 3
     - no: request Google permissions and tokens via oauth, go to 3

  3. user is member of at least one team of two members?
     - yes: go to destination
     - no:
         team creation has started?
         - yes: let user add executive or assistant, send or cancel invites;
                then go to destination
         - no: create a team with just one user, go to 'yes'
               (using assistant as temporary executive if needed)

*/

var signin = (function() {
  var mod = [];

  function requestGoogleAuth(url) {
    log("Going off to " + url);
    window.location = url;
  }

  function setLoginNonce() {
    /* We use Esper as our random number generator because it's
       a single implementation and it's under our control, as opposed
       to whatever broken browser the user might use.
    */
    return api.random()
      .then(function(x) {
        var loginNonce = x.random;
        if (loginNonce.length >= 64) {
          store.set("login_nonce", loginNonce);
          return loginNonce;
        }
      });
  }

  function getLoginNonce() {
    return store.get("login_nonce");
  }

  function clearLoginNonce() {
    store.remove("login_nonce");
  }

  function displayLoginLinks(msg, landingUrl, optInvite) {
'''
<div #view>
  <div #msgDiv/>
  <button #button
          class="google-sign-in"/>
</div>
'''
    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    if (util.isString(msg))
      msgDiv.text(msg);

    setLoginNonce()
      .done(function(loginNonce) {
        rootView.removeClass("hide");

        button.click(function() {
          api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite)
            .done(function(x) {
              requestGoogleAuth(x.url);
            });
        });

        rootView.append(view);
      });

    return _view;
  }

  function displayLogoutLinks() {
'''
<div class="hide">
  <div #logout class="hide">
    <a href="#!logout">Log out of Esper</a>
  </div>
  <div #revoke class="hide">
    <a href="#">Revoke Esper&quot;s access to my Google account</a>
  </div>
</div>
'''
    var view = $("#onboarding-interface");
    view.children().remove();
    view.append(_view);

    revoke.click(function() {
      api.postGoogleAuthRevoke()
        .done(function() {
          revoke.remove();
        });
      return false;
    });

    api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        logout.removeClass("hide");
        if (info.has_token)
          revoke.removeClass("hide");
        else {
          requestGoogleAuth(info.google_auth_url);
        }
      });

    view.removeClass("hide");
  }

  function showTokenDetails(loginView, tokenDescription) {
    loginView.msgDiv.text(JSON.stringify(tokenDescription));
  }

  function useInvite(inviteCode) {
    log("useInvite");
    return api.postToken(inviteCode)
      .then(
        /* success */
        function(tokenDescription) {
          var loginView = displayLoginLinks("", "#!", inviteCode);
          showTokenDetails(loginView, tokenDescription);
        },
        /* failure */
        function() {
          displayLoginLinks("Invalid invite.", "#!");
        }
      );
  }

  function loginOrSignup() {
    log("loginOrSignup");
    var uid = login.me();
    var landingUrl = document.URL;
    if (util.isDefined(uid)) {
      return api.getLoginInfo()
        .then(
          /* success */
          function(x) {
            login.setLoginInfo(x);
            return deferred.defer(true);
          },
          /* failure */
          function() {
            /* useful for testing; may not be ideal in production */
            login.clearLoginInfo();
            displayLoginLinks("Something's wrong. Please try to log in.",
                              landingUrl);
            return deferred.defer(false);
          });
    } else {
      displayLoginLinks("Please log in.", landingUrl);
      return deferred.defer(false);
    }
  }

  function checkGooglePermissions(landingUrl) {
    log("checkGooglePermissions");
    return api.getGoogleAuthInfo(landingUrl)
      .then(function(info) {
        if (info.has_token)
          return true;
        else {
          requestGoogleAuth(info.google_auth_url);
          return false;
        }
      });
  }

  function completeTeam() {
    log("completeTeam");
    // TODO: return successfully only once the team is complete
    return deferred.defer();
  }

  mod.signin = function(whenDone, optInviteCode) {
    if (util.isString(optInviteCode)) {
      useInvite(optInviteCode);
    } else {
      loginOrSignup()
        .done(function(ok) {
          if (ok) {
            var landingUrl = document.URL;
            checkGooglePermissions(landingUrl)
              .done(function(ok) {
                if (ok) {
                  displayLogoutLinks();
                  completeTeam()
                    .done(function() {
                      log("sign-in done");
                      whenDone();
                    });
                }
              });
          }
        });
    }
  };

  function goToRelativeUrl(url) {
    var relativeUrl = parseUrl.toRelative(parseUrl.parse(url));
    window.location = relativeUrl;
  }

  mod.loginOnce = function(uid, landingUrl) {
    var loginNonce = getLoginNonce();
    log("loginOnce: " + uid + " " + landingUrl + " " + loginNonce);
    api.loginOnce(uid, loginNonce)
      .done(function(loginInfo) {
        login.setLoginInfo(loginInfo);
        clearLoginNonce();
        /* Make sure we don't redirect to a phishing URL: discard host. */
        goToRelativeUrl(landingUrl);
      })
      .fail(function() {
        clearLoginNonce();
        goToRelativeUrl(landingUrl); /* and try again */
      });
  };

  return mod;
})();
