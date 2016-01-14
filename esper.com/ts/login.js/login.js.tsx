/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Login.Oauth.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Components.ApproveTeam.tsx" />

module Esper {
  // Where to redirect
  var DEFAULT_REDIRECT = "time";

  export function init() {
    var uid = Util.getParamByName(Login.uidParam);
    var message = Util.getParamByName(Login.messageParam);
    var error = Util.getParamByName(Login.errorParam);

    if (Util.getParamByName(Login.logoutParam)) {
      Login.logout();
      message = message || "You have been logged out.";
    }

    if (uid) {
      Login.loginOnce(uid)
        .then(function(response) {
          Login.setCredentials(response.uid, response.api_secret);
          if (Login.needApproval(response)) {
            Layout.renderModal(<Components.ApproveTeamsModal
              info={response} onApprove={redirect} onReject={onReject} />)
          } else {
            redirect(response);
          }
        }, function(err) {
          Log.e("Unable to login");
          var errMsg = "There was an error logging you in."
          if (err === Login.MISSING_NONCE) {
            errMsg += (" If you are using Safari, please try using a " +
              "different browser. If you are in Incognito or Private Mode, " +
              "please try disabling it.");
            Log.e("Missing nonce");
          }
          renderLogin("", errMsg);
        });
    } else {
      renderLogin(message, error)
    }
  }

  function redirect(response: ApiT.LoginResponse) {
    Login.storeCredentials(response);
    Layout.render(<div className="esper-full-screen">
      <div className="esper-center">
        <div className="esper-spinner"></div>
      </div>
    </div>);
    location.href = "/" + getLandingUrl();
  }

  function onReject(response: ApiT.LoginResponse, removedTeams: ApiT.Team[]) {
    var teamIds = _.map(removedTeams, (t) => t.teamid);
    Login.ignoreTeamIds(teamIds);
    redirect(response);
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
         }{
           error ? <span>
             {" "}Please {" "}<a href="/contact">contact us</a> if this
             continues to happen.
           </span> : ""
         }</div>
      </Components.LoginPrompt>
    </div>);
  }
}

Esper.init();
