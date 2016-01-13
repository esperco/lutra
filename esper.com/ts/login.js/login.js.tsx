/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.Oauth.ts" />
/// <reference path="./Components.Login.tsx" />

module Esper {
  // Where to redirect
  var DEFAULT_REDIRECT = "time";

  export function init() {
    var uid = Util.getParamByName("uid");

    if (uid) {
      Login.loginOnce(uid)
        .done(function() {
          Layout.render(<div>
            You are logged in. Redirecting &hellip;
          </div>);
          location.href = "/" + DEFAULT_REDIRECT;
        })
        .fail(function() {
          Log.e("Unable to login");
          renderLogin();
        });
    } else {
      renderLogin()
    }
  }

  function getLandingUrl() {
    var r = Util.getParamByName("redirect") || DEFAULT_REDIRECT;
    if (r[0] === "/") {
      r = r.slice(1);
    }
    return r;
  }

  function renderLogin() {
    Layout.render(<div id="esper-login-container">
      <Components.LoginPrompt
        landingUrl={getLandingUrl()}
        showGoogle={true}
        showExchange={true}
        showNylas={true}>
        <div className="alert alert-info text-center">
          Esper uses data from your calendar and other sources to provide you
          insight into how you spend your time. Please login with your calendar
          provider to continue.
        </div>
      </Components.LoginPrompt>
    </div>);
  }
}

Esper.init();
