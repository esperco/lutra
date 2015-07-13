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

  function displayLoginLinks(msg, landingUrl, optInvite, optEmail, onboarding = false) {
'''
<div #view>
  <div #signInContainer class="sign-in">
    <div #logo class="logo-container">
      <div #loginLogo id="sign-in-hero-mark" class="animated fadeInUp"/>
    </div>
    <div #container >
      <div #progress class="progress">
        <div class="progress-bar progress-bar-info" role="progressbar" style="width:50%"/> 
      </div>
    <div #msgDiv class="sign-in-msg"/>
    <button #button class="button-primary sign-in-btn">
      <div #google class="google-g"/>
      <div class="btn-divider"/>
      <div class="sign-in-text">Sign in with Google</div>
    </button>
  </div>
  <div #footer class="sign-in-footer">
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

    setLoginNonce()
      .done(function(loginNonce) {
        rootView.removeClass("hide");

        button.click(function() {
          Api.getGoogleAuthUrl(landingUrl, loginNonce, optInvite, optEmail)
            .done(function(x) {
              requestGoogleAuth(x.url);
            });
        });

        rootView.append(view);
        });

    if (onboarding) {
      container.addClass("container");
      signInContainer.removeClass("sign-in");
      signInContainer.addClass("onboarding");
      signInContainer.css("padding-top","78px");
      msgDiv.removeClass("sign-in-msg");
      msgDiv.addClass("onboarding-text");
      msgDiv.css("padding-bottom","16px");
      signInContainer.css("text-align","center");
      footer.remove();
      logo.remove();
    }
    else {
      progress.hide();
    }



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
          displayLoginLinks("<b>Great!</b> Next, we'll need you to login to your primary Google account.<br>", "#!", inviteCode, undefined, true);
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
      displayLoginLinks("Sign in to continue.",
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
        location.hash = "!";
      })
      .fail(function() {
        clearLoginNonce();
        location.hash = "!";
      });
  };

}
