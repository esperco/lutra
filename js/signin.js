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
  <div class="sign-in">
    <div class="logo-container">
      <div #loginLogo id="sign-in-hero-mark" class="animated fadeInUp"/>
    </div>
    <div #msgDiv class="sign-in-msg"/>
    <button #button class="sign-in-btn">
      <div #google class="google-g"/>
      <div class="btn-divider"/>
      <div class="sign-in-text">Sign in with Google</div>
    </button>
  </div>
  <div class="sign-in-footer">
    <div class="copyright">
      &copy; 2014 Esper Technologies, Inc.
      All rights reserved.
    </div>
    <a href="mailto:team@esper.com" class="footer-link">Help</a>
    <div class="footer-divider"/>
    <a href="http://esper.com/privacypolicy.html"
       target="blank"
       class="footer-link">Privacy</a>
    <div class="footer-divider"/>
    <a href="http://esper.com/termsofuse.html"
       target="blank"
       class="footer-link">
         Terms
    </a>
  </div>
</div>
'''
    page.hide();

    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    $("#login-status").addClass("hide");

    var logo = $("<img class='svg-block hero-mark'/>")
      .appendTo(loginLogo);
    svg.loadImg(logo, "/assets/img/esper-mark.svg");

    if (util.isString(msg))
      msgDiv.text(msg);

    var googleG = $("<img class='svg-block'/>")
      .appendTo(google);
    svg.loadImg(googleG, "/assets/img/google-g.svg");

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
    Log.d(JSON.stringify(tokenDescription));
  }

  function useInvite(inviteCode) {
    log("useInvite");
    return api.postToken(inviteCode)
      .then(
        /* success */
        function(tokenDescription) {
          var loginView =
            displayLoginLinks("Valid invite.", "#!", inviteCode, undefined);
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
    landingUrl.hash = "#!";
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
            displayLoginLinks("Something's wrong. Please try to sign in.",
                              landingUrl,
                              undefined,
                              optEmail);
            return deferred.defer(false);
          });
    } else {
      displayLoginLinks("Sign in to continue.",
                        landingUrl, undefined, optEmail);
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
                page.settings.load();
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
    /*
      TODO: figure out why redirecting to landingUrl causes an infinite loop;
            disabled for now.
     */
    api.loginOnce(uid, loginNonce)
      .done(function(loginInfo) {
        login.setLoginInfo(loginInfo);
        clearLoginNonce();
        /* Make sure we don't redirect to a phishing URL: discard host. */
        goToRelativeUrl("/#!");
      })
      .fail(function() {
        clearLoginNonce();
        goToRelativeUrl("/#!");
      });
  };

  return mod;
})();
