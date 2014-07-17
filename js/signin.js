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

  /* Go straight to Google Oauth page without displaying the sign-in button */
  function forceLogin(landingUrl, optInvite, optEmail) {
    setLoginNonce()
      .done(function(loginNonce) {
        api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite, optEmail)
          .done(function(x) {
            requestGoogleAuth(x.url);
          });
      });
  }

  function displayLoginLinks(msg, landingUrl, optInvite, optEmail) {
'''
<div #view>
  <div #msgDiv/>
  <button #button
          class="google-sign-in"/>
</div>
'''
    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    $("#login-status").addClass("hide");

    if (util.isString(msg))
      msgDiv.text(msg);

    setLoginNonce()
      .done(function(loginNonce) {
        rootView.removeClass("hide");

        button.click(function() {
          api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite, optEmail)
            .done(function(x) {
              requestGoogleAuth(x.url);
            });
        });

        rootView.append(view);
      });

    return _view;
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
          var loginView = displayLoginLinks("", "#!", inviteCode, undefined);
          showTokenDetails(loginView, tokenDescription);
        },
        /* failure */
        function() {
          displayLoginLinks("Invalid invite.", "#!", undefined);
        }
      );
  }

  function loginOrSignup(optEmail) {
    log("loginOrSignup");
    var uid = login.me();
    var landingUrl = document.URL;
    if (util.isDefined(optEmail)) {
      forceLogin(landingUrl, undefined, optEmail);
    } else if (util.isDefined(uid)) {
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
                              landingUrl,
                              undefined,
                              optEmail);
            return deferred.defer(false);
          });
    } else {
      displayLoginLinks("Please log in.", landingUrl, undefined, optEmail);
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

  function composeInviteForRole(role) {
    var invite = {
      from_uid: login.me(),
      teamid: login.getTeam().teamid,
      role: role
    };
    api.inviteJoinTeam(invite)
      .done(function(x) {
        var url = x.url;
        var body =
          "Please click the link and sign in with your Google account:\n\n"
          + "  " + url;

        gmailCompose.compose({
          subject: "Join my team on Esper",
          body: body
        });
      });
  }

  function displayInviteDialog() {
'''
<div #root>
  <div>Invite team members:</div>
  <div #roleSelector/>
  <button #closeButton class="btn btn-default">Close</button>
</div>
'''
    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    var role;

    var sel = select.create({
      defaultAction: function(v) {
        role = v;
        if (util.isString(role))
          composeInviteForRole(role);
      },
      options: [
        { label: "Pick a role" },
        { label: "Executive", value: "Executive" },
        { label: "Assistant", value: "Assistant" }
      ]
    });

    closeButton.click(function() {
      rootView.addClass("hide");
      $("#main-content").removeClass("hide");
    })

    sel.view.appendTo(roleSelector);
    rootView.append(root);
    rootView.removeClass("hide");
  }

  function completeTeam() {
    log("completeTeam");
    var team = login.getTeam();
    if (util.isDefined(team)) {
      log("team", team);
      var assistants = team.team_assistants;
      if (true /*assistants.length === 0*/) {
        displayInviteDialog();
      } else {
        $("#main-content").removeClass("hide");
      }
    }
    return deferred.defer();
  }

  mod.signin = function(whenDone, optInviteCode, optEmail) {
    if (util.isString(optInviteCode)) {
      useInvite(optInviteCode);
    } else {
      loginOrSignup(optEmail)
        .done(function(ok) {
          if (ok) {
            var landingUrl = document.URL;
            checkGooglePermissions(landingUrl)
              .done(function(ok) {
                if (ok) {
                  completeTeam()
                    .done(function() {
                      log("sign-in done");
                      whenDone();
                      labelSettings.load();
                    });
                  labelSettings.load();
                }
              });
          }
        });
    }
  };

  function goToRelativeUrl(url) {
    var relativeUrl = parseUrl.toRelative(parseUrl.parse(url));
    log("Going to " + relativeUrl);
    $(document).ready(function() {
      window.location.assign(relativeUrl);
      window.location.reload();
    });
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
