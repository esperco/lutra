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

module Signin {

  function requestGoogleAuth(url) {
    Log.d("Going off to " + url);
    window.location = url;
  }

  function setLoginNonce() {
    /* We use Esper as our random number generator because it's
       a single implementation and it's under our control, as opposed
       to whatever broken browser the user might use.
    */
    return Api.random()
      .then(function(x) {
        var loginNonce = x.random;
        if (loginNonce.length >= 64) {
          Store.set("login_nonce", loginNonce);
          return loginNonce;
        }
      });
  }

  function getLoginNonce() {
    return Store.get("login_nonce");
  }

  function clearLoginNonce() {
    Store.remove("login_nonce");
  }

  /* Go straight to Google Oauth page without displaying the sign-in button */
  function forceLogin(landingUrl, optInvite, optEmail) {
    setLoginNonce()
      .done(function(loginNonce) {
        Api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite, optEmail)
          .done(function(x) {
            requestGoogleAuth(x.url);
          });
      });
  }

  // Returns a jQuery Deferred that resolves to a string token to be used
  // for signup purposes
  function getSignupToken(): JQueryPromise<string> {
    return Api.createOwnTeam()
      .then(function(data: ApiT.UrlResult) {
        return data.url.match(/#!t\/(.+)\/?$/)[1];
      });
  };

  function displayLoginLinks(msg, landingUrl, optInvite, optEmail) {
'''
<div #view>
  <div #signInContainer class="sign-in">
    <div #logo class="logo-container">
      <div #loginLogo id="sign-in-hero-mark" class="animated fadeInUp"/>
    </div>
    <div #container>
      <div #msgDiv class="sign-in-msg"/>
      <button #button class="button-primary sign-in-btn">
        <div #google class="google-g"/>
        <div class="btn-divider"/>
        <div class="sign-in-text">Sign in with Google</div>
      </button>
      <div class="advisory">
        <div>
          <a href="#!" #googleMsgToggle>
            Can I use something other than Google?
          </a>
        </div>
        <div #googleMsg>
          Our assistants need access to your calendar to assist you
          with scheduling. If you use Microsoft Outlook or 
          Exchange instead of Google Apps, please contact us at
          <a href="mailto:support@esper.com">support@esper.com</a> to 
          get set up.
        </div>
      </div>
    </div>
  </div>
  <div #footer class="sign-in-footer">
    <div class="copyright">
      &copy; 2014 Esper Technologies, Inc.
      All rights reserved.
    </div>
    <a href="mailto:support@esper.com" class="footer-link">Help</a>
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
    Page.hide();
    var rootView = $("#onboarding-interface");
    rootView.children().remove();

    $("#login-status").addClass("hide");

    var logo = $("<img class='svg-block hero-mark'/>")
      .appendTo(loginLogo);
    Svg.loadImg(logo, "/assets/img/esper-mark.svg");

    if (Util.isString(msg))
      msgDiv.html(msg);

    var googleG = $("<img class='svg-block'/>")
      .appendTo(google);
    Svg.loadImg(googleG, "/assets/img/google-g.svg");

    googleMsg.hide();
    googleMsgToggle.click(function() {
      googleMsg.show();
      googleMsgToggle.hide();
      return false;
    });

    setLoginNonce()
      .done(function(loginNonce) {
        rootView.removeClass("hide");

        button.click(function() {
          // Helper
          let goToGoogle = function(): void {
            Api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite, optEmail)
              .done(function(x) {
                requestGoogleAuth(x.url);
              });
          };

          // We should always have an invite token before going to Google --
          // if one is passed just use that.
          if (optInvite) {
            goToGoogle();
          }

          // Else ask server for one
          else {
            getSignupToken().then(function(token) {
              optInvite = token;
              goToGoogle();
            });
          }
        });

        rootView.append(view);
        });

    return _view;
  }

  function showTokenDetails(loginView, tokenDescription) {
    Log.d(JSON.stringify(tokenDescription));
  }

  function useInvite(inviteCode) {
    Log.d("useInvite");
    return Api.postToken(inviteCode)
      .then(
        /* success */
        function(tokenDescription) {
          var loginView =
          displayLoginLinks("Thanks for accepting our invite! " + 
            "Please sign in with your primary Google account to continue.", 
            "#!", inviteCode, undefined);
          showTokenDetails(loginView, tokenDescription);
        },
        /* failure */
        function() {
          displayLoginLinks("Invalid invite.", "#!", undefined, undefined);
        }
      );
  }

  function useInviteWithNameAndEmail(inviteCode: string,
                                     email: string,
                                     name: string) {
    return Api.postTokenEmail(inviteCode, email, name)
      .then(
        /* success */
        function(tokenDescription) {
          var loginView =
            displayLoginLinks(
              "Thanks for signing up! Please log in to continue.",
              "#!",
              inviteCode,
              undefined);
          showTokenDetails(loginView, tokenDescription);
        },
        /* failure */
        function() {
          displayLoginLinks("Invalid invite.", "#!", undefined, undefined);
        }
      );
  }

  function loginOrSignup(optEmail) {
    Log.d("loginOrSignup");
    var uid = Login.me();
    var landingUrl = document.URL;
    landingUrl["hash"] = "#!";
    if (Util.isDefined(optEmail)) {
      forceLogin(landingUrl, undefined, optEmail);
    } else if (Util.isDefined(uid)) {
      return Api.getLoginInfo()
        .then(
          /* success */
          function(x) {
            Login.setLoginInfo(x);
            return Deferred.defer(true);
          },
          /* failure */
          function() {
            /* useful for testing; may not be ideal in production */
            Login.clearLoginInfo();
            displayLoginLinks("Something's wrong. Please try to sign in.",
                              landingUrl,
                              undefined,
                              optEmail);
            return Deferred.defer(false);
          });
    } else {
      displayLoginLinks("Click below to sign up or sign in.",
                        landingUrl, undefined, optEmail);
      return Deferred.defer(false);
    }
  }

  /* Logged-in user with the admin privilege can login as any other user. */
  export function loginAs(email: string) {
    Api.loginAs(email)
      .done(function(loginResponse) {
        Login.setLoginInfo(loginResponse);
        location.reload();
      });
  }

  function checkGooglePermissions(landingUrl) {
    Log.d("checkGooglePermissions " + landingUrl);
    return Api.getGoogleAuthInfo(landingUrl)
      .then(function(info) {
        if (info.is_assistant && info.need_google_auth) {
          requestGoogleAuth(info.google_auth_url);
          return false;
        }
        else
          return true;
      });
  }

  export function signin(whenDone: { (...any): void },
                         optArgs?: any[],
                         optInviteCode?: string,
                         optEmail?: string,
                         optName?: string) {
    document.title = "Sign in - Esper";
    if (optInviteCode != undefined) {
      if (optEmail != undefined && optName != undefined)
        useInviteWithNameAndEmail(optInviteCode, optEmail, optName);
        else
        useInvite(optInviteCode);
    } else {
      loginOrSignup(optEmail)
        .done(function(ok) {
          if (ok) {
            var landingUrl = document.URL;
            checkGooglePermissions(landingUrl)
              .done(function(ok) {
                if (Array.isArray(optArgs)) // how it should be.
                  whenDone.apply(this, optArgs);
                else // it's a bug but whatever.
                  whenDone(optArgs);
              });
          }
        });
    }
  };

  export function loginOnce(uid, landingUrl) {
    var loginNonce = getLoginNonce();
    /*
      TODO: figure out why redirecting to landingUrl causes an infinite loop;
            disabled for now.
     */
    Log.d("loginOnce: " + uid + " " + landingUrl + " (ignored) " + loginNonce);
    Api.loginOnce(uid, loginNonce)
      .done(function(loginInfo) {
        Login.setLoginInfo(loginInfo);
        clearLoginNonce();

        window.location.hash = "!";
        // NB: CanJS routing doesn't seem to catch this hash change sometimes.
        // Call settings page load directly.
        Page.settings.load();
      })
      .fail(function() {
        clearLoginNonce();
        window.location.hash = "!";
      });
  };

}
