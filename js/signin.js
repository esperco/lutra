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
    window.location = url;
  }

  function displayLoginLinks() {
'''
<button #button
        class="google-sign-in"/>
'''
    var view = $("#onboarding-interface");
    view.children().remove();
    view.removeClass("hide");
    view.append(_view);
  }

  function displayLogoutLinks() {
'''
<div #logout>
  <a href="#!logout">Log out of Esper</a>
</div>
<div #revoke>
  <a href="#">Revoke Esper&quot;s access to my Google account</a>
</div>
'''
    var view = $("#onboarding-interface");
    view.children().remove();

    revoke.click(function() {
      api.postGoogleAuthRevoke().done(revoke.remove());
      return false;
    });

    api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        view.append(logout);
        if (info.has_token) view.append(revoke);
        else window.location = info.google_auth_url;
      });
  }

  function checkInviteCode(optInviteCode) {
    if (util.isString(optInviteCode)) {
      api.loginInvite(optInviteCode)
        .then(
          /* success */
          function(x) {
            login.setLoginInfo(x);
          },
          /* failure */
          function() {
            displayLoginLinks();
          }
        );
    }
  }

  function loginOrSignup() {
    var uid = login.me();
    if (util.isDefined(uid)) {
      return api.getLoginInfo()
        .then(
          /* success */
          function(x) {
            login.setLoginInfo(x);
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
    // TODO: return successfully only once the team is complete
    return deferred.fail();
  }

  mod.signin = function(whenDone, optInviteCode) {
    loginOrSignup(optInviteCode)
      .done(function() {
        checkGooglePermissions()
          .done(function(ok) {
            if (ok) {
              displayLogoutLinks();
              completeTeam()
                .done(function() {
                  whenDone();
                })
            }
          });
      });
  };

  return mod;
})();
