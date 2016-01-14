/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.Oauth.ts" />
/// <reference path="./Components.Login.tsx" />

module Esper {
  // Where to redirect
  var DEFAULT_REDIRECT = "time";

  export function init() {
    if (Util.getParamByName(Login.logoutParam)) {
      Login.logout();
    }

    var uid = Util.getParamByName(Login.uidParam);
    var message = Util.getParamByName(Login.messageParam);
    var error = Util.getParamByName(Login.errorParam);

    if (uid) {
      Login.loginOnce(uid)
        .done(function() {
          Layout.render(<div className="esper-full-screen">
            <div className="esper-center">
              <div className="esper-spinner"></div>
            </div>
          </div>);
          location.href = "/" + getLandingUrl();
        })
        .fail(function() {
          Log.e("Unable to login");
          renderLogin("", "There was an error logging in. Please try again.");
        });
    } else {
      renderLogin(message, error)
    }
  }

  function getLandingUrl() {
    var r = Util.getParamByName(Login.redirectParam);
    r = (r ? Util.hexDecode(r) : DEFAULT_REDIRECT);
    if (r[0] === "/") {
      r = r.slice(1);
    }
    return r;
  }

  function renderLogin(message?: string, error?: string) {
    Layout.render(<div id="esper-login-container">
      <Components.LoginPrompt
        landingUrl={getLandingUrl()}
        showGoogle={true}
        showExchange={true}
        showNylas={true}>
        <div className={
          "alert text-center alert-" + (error ? "danger" : "info")
        }>{ error || message || <span>
              Esper uses data from your calendar and other sources to provide
              you insight into how you spend your time. Please log in with your
              calendar provider to continue.
            </span>
         }</div>
      </Components.LoginPrompt>
    </div>);
  }
}

Esper.init();
