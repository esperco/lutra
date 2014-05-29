/*
  Whenever the page is loaded, before executing the code corresponding
  to the URL, the following must be checked:
  - user is logged in;
  - Esper has all the permissions it needs to access the Google services
    on behalf of the user;
  - user is member of at least one complete team (one executive, one assistant)

  The flow is as follows:

  1. user has api_secret (login cookie)?
     - yes: check api_secret validity, go to 2
     - no:
         user provides invite code?
           - yes: log in with invite code, go to 2
           - no:
             * display "Google sign-in" button for members (goes to 2)
             * display a link to "let us put you on the waiting list" page

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

  function displayLoginLinks(msg) {
'''
<div #view>
  <div #msgDiv/>
  <button #button
          class="google-sign-in"/>
</div>
'''
    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    setLoginNonce()
      .done(function(loginNonce) {
        rootView.removeClass("hide");

        if (util.isString(msg))
          msgDiv.text(msg);

        button.click(function() {
          api.getGoogleAuthUrl(document.URL, loginNonce)
            .done(function(x) {
              requestGoogleAuth(x.url);
            });
        });

        rootView.append(view);
      });
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

  function checkInviteCode(optInviteCode) {
    log("checkInviteCode");
    if (util.isString(optInviteCode)) {
      return api.loginInvite(optInviteCode)
        .then(
          /* success */
          function(x) {
            login.setLoginInfo(x);
            return deferred.defer(true);
          },
          /* failure */
          function() {
            displayLoginLinks("Invalid invite.");
            return deferred.defer(false);
          }
        );
    }
    else {
      displayLoginLinks(
        "Please log in using the GMail account that you use with Esper. "
      + "If you're not an Esper member yet, you may join the waiting list."
      );
      return deferred.defer(false);
    }
  }

  function loginOrSignup(optInviteCode) {
    log("loginOrSignup");
    var uid = login.me();
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
            return checkInviteCode(optInviteCode);
          });
    } else {
      return checkInviteCode(optInviteCode);
    }
  }

  function checkGooglePermissions() {
    log("checkGooglePermissions");
    return api.getGoogleAuthInfo(document.URL)
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
    return deferred.fail();
  }

  mod.signin = function(whenDone, optInviteCode) {
    loginOrSignup(optInviteCode)
      .done(function(ok) {
        if (ok) {
          checkGooglePermissions()
            .done(function(ok) {
              if (ok) {
                displayLogoutLinks();
                completeTeam()
                  .done(function() {
                    log("sign-in done");
                    whenDone();
                  })
              }
            });
        }
      });
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
