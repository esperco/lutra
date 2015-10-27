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

module Esper.Signin {

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

  // Returns jQuery wrapped HTML code for a Google Button
  export function googleButton(landingUrl?: string,
                               optInvite?: string,
                               optEmail?: string):
    JQuery {
'''
<button #button class="button-primary sign-in-btn google-btn">
  <div #logo class="google-g sign-in-icon"/>
  <div class="sign-in-text">Google Account</div>
</button>
'''
    var googleG = $("<img class='svg-block'/>")
      .appendTo(logo);
    Svg.loadImg(googleG, "/assets/img/google-g.svg");

    // Set handler
    button.click(function() {
      let nonce = "";

      // Generate login nonce
      let loginNonceCall = setLoginNonce();
      loginNonceCall.done(function(loginNonce) {
        // Assign to higher-scoped variable so our other callbacks can see it
        nonce = loginNonce;
      });
      let calls = [loginNonceCall];

      // Run token and nonce calls in parallel
      Deferred.join(calls, true)
        // Get Google endpoint based on nonce and token
        .then(function() {
          landingUrl = landingUrl || "#!";
          return Api.getGoogleAuthUrl(landingUrl, nonce, optInvite, optEmail);
        }, function(err) { console.error(err); })
        // Redirect to Google
        .then(function(x) {
          requestGoogleAuth(x.url);
        }, function(err) { console.error(err); });
    });

    return button;
  };

  // Returns jQuery wrapped HTML code for an Exchange / Nylas Button
  export function exchangeButton(landingUrl?: string,
                                 optInvite?: string,
                                 optEmail?: string):
    JQuery {
'''
<button #button class="button-primary sign-in-btn exchange-btn">
  <div #logo class="sign-in-icon exchange-icon"/>
  <div class="sign-in-text">Microsoft Exchange</div>
</button>
'''
    var exchangeIcon = $("<img class='svg-block'/>")
      .appendTo(logo);
    Svg.loadImg(exchangeIcon, "/assets/img/exchange.svg");

    // Set handler
    button.click(function() {
      showExchangeModal();
      return false;
    });

    return button;
  };

  function showExchangeModal() {
'''
<div #modal class="modal fade" tabindex="-1" role="dialog">
  <div class="modal-dialog short exchange-modal">
    <div class="modal-content">
      <form #emailForm class="form">
        <div class="modal-header">
          <i class="fa fa-fw fa-sign-in"></i>
          Log in with Exchange or Office 365
        </div>
        <div #emailGroup class="modal-body form-group">
          <label for="exchange-email" class="control-label">
            Exchange email address</label>
          <input #emailInput id="exchange-email" type="text" tabindex="0"
                 placeholder="hello@office365.com" class="form-control" />
        </div>
        <div class="modal-footer">
          <button type="submit" #saveBtn class="button-primary modal-primary">
            Save</button>
          <button #cancelBtn class="button-secondary modal-cancel">
            Cancel</button>
        </div>
      </form>
    </div>
  </div>
</div>
'''
    (<any> modal).modal({});
    (<any> modal).on('shown.bs.modal', function() {
      emailInput.focus();
    });

    cancelBtn.click(function() {
      (<any> modal).modal('hide');
      return false;
    });

    emailForm.submit(function() {
      emailGroup.removeClass("has-error");
      var email = emailInput.val();

      if (! Util.validateEmailAddress(email)) {
        emailGroup.addClass("has-error");
      } else {
        saveBtn.text("Saving ...");
        saveBtn.prop("disabled", true);
        Api.getNylasLoginUrl(email)
          .then(function(result) {
            setLoginNonce().done(function(loginNonce) {
              var url = result.url + "&state=" + loginNonce;
              window.location.href = url;
            });
          }, function(err) {
            console.error(err);
            saveBtn.text("Save");
            saveBtn.prop("disabled", false);
            return err;
          });
      }
      return false;
    });

    return modal;
  }

  function displayLoginLinks(msg, landingUrl, optInvite, optEmail) {
'''
<div #view>
  <div #signInContainer class="sign-in">
    <div #logo class="logo-container">
      <div #loginLogo id="sign-in-hero-mark" class="animated fadeInUp"/>
    </div>
    <div #container>
      <div #msgDiv class="sign-in-msg"/>
      <div #buttonContainer />
      <div class="advisory">
        <p>Use Microsoft Office or Exchange?
        Contact us at <a href="mailto:support@esper.com">support@esper.com</a>
        for assistance.</p>
        <p>
          By signing in, you agree to Esper's
          <a href="http://esper.com/terms-of-use">Terms of Use.</a>
        </p>
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
    var rootView = $("#login-interface");
    rootView.children().remove();

    $("#login-status").addClass("hide");

    var logo = $("<img class='svg-block hero-mark'/>")
      .appendTo(loginLogo);
    Svg.loadImg(logo, "/assets/img/esper-mark.svg");

    if (Util.isString(msg))
      msgDiv.html(msg);

    buttonContainer.append(googleButton(landingUrl, optInvite, optEmail));
    buttonContainer.append(exchangeButton(landingUrl, optInvite, optEmail));

    rootView.removeClass("hide");
    rootView.append(view);

    $('#init-loading').fadeOut(600);
    return _view;
  }

  function showTokenDetails(tokenDescription) {
    Log.d(JSON.stringify(tokenDescription));
  }

  function useInvite(inviteCode) {
    Log.d("useInvite");
    return Api.postToken(inviteCode)
      .then(
        /* success */
        function(tokenDescription) {
          showTokenDetails(tokenDescription);

          // Log out if applicable
          if (Login.data) {
            Login.clearLoginInfo();
          }

          // Show login data
          displayLoginLinks("Welcome to Esper! Please sign in.",
            "#!", inviteCode, null);
        },
        /* failure */
        function() {
          Route.nav.home();
          Status.reportError("Invalid invite code");
        }
      );
  }

  function loginOrSignup(optEmail) {
    Log.d("loginOrSignup - " + optEmail);
    var uid = Login.me();
    var landingUrl = location.hash;
    if (Util.isDefined(optEmail) && Login.myEmail() !== optEmail) {
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
      displayLoginLinks("Click below to sign in.",
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

  export function signin( whenDone?: { (): void },
                          optInviteCode?: string,
                          optEmail?: string) {
    document.title = "Sign in - Esper";
    if (optInviteCode !== undefined) {
      useInvite(optInviteCode);
    } else {
      var p = loginOrSignup(optEmail)
      if (p) {
        p.done(function(ok) { // Logged in
          if (ok) {
            var landingUrl = document.URL;
            whenDone = whenDone || function() { };
            if (Login.isNylas()) {
              whenDone();
            } else {
              checkGooglePermissions(landingUrl).done(whenDone);
            }
          }
        });
      } else {
        Log.d("No login or signup promise - stopping");
      }
    }
  };

  export function loginOnce(uid, landingUrl) {
    var loginNonce = getLoginNonce();
    Log.d("loginOnce: " + uid + " " + landingUrl + " (ignored) " + loginNonce);
    var loginCall = JsonHttp.noWarn(function() {
      return Api.loginOnce(uid, loginNonce)
    });
    loginCall
      .done(function(loginInfo) {
        Login.setLoginInfo(loginInfo);
        clearLoginNonce();
        Route.nav.path(landingUrl || "");
      })
      .fail(function(err) {
        clearLoginNonce();
        if (err['status'] === 403) {
          Route.nav.home();
          Status.report($(`<span>We were unable to log you in. Please contact
            <a href="mailto:support@esper.com">support@esper.com</a> for
            information about joining.</span>`), "danger");
        } else {
          Route.nav.home();
          Status.reportError("We were unable to login.");
        }
      });
  };

}
