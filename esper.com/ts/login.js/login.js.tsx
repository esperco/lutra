/// <reference path="../../../typings/browser.d.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="./Login.Oauth.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Views.ApproveTeam.tsx" />
/// <reference path="./Token.ts" />

module Esper {
  // Where to redirect
  var DEFAULT_REDIRECT = "time";
  var EXT_REDIRECT = "chrome-ext";

  export function init() {
    showSpinner();

    var uid = Util.getParamByName(Login.uidParam);
    var message = Util.getParamByName(Login.messageParam);
    var error = Util.getParamByName(Login.errorParam);
    var extLogin = Util.getParamByName(Login.extParam);
    var token = Util.getParamByName(Login.tokenParam);
    var platform = Util.getParamByName(Login.platformParam).toLowerCase();
    var email = getEmail();

    if (Util.getParamByName(Login.logoutParam)) {
      Login.logout();
      message = message || "You have been logged out.";
    }

    if (extLogin) {
      if (email) {
        Login.loginWithGoogle({
          landingUrl: getLandingUrl(),
          email: email,
          inviteCode: getInviteCode(),
          extension: true
        });
      } else {
        Log.e("Extension login requires e-mail address");
        renderLogin(message, error);
      }
    }

    else if (platform === "google") {
      Login.loginWithGoogle({
        landingUrl: getLandingUrl(),
        email: email,
        inviteCode: getInviteCode()
      });
    }

    else if (platform) {
      if (email) {
        Login.loginWithNylas({
          landingUrl: getLandingUrl(),
          email: email,
          inviteCode: getInviteCode()
        });
      } else {
        renderLogin(message, error);
      }
    }

    else if (uid) {
      handleLoginInfo(Login.loginOnce(uid));
    }

    else if (token) {
      Token.consume(token, handleLoginInfo, function(message, error) {
        var r = Util.getParamByName(Login.redirectParam);
        if (r && Login.initCredentials()) {
        // If already logged in, ignore the token error and go straight to
        // the destination.
          redirect();
        } else {
          renderLogin(message, error);
        }
      });
    }

    else {
      renderLogin(message, error)
    }
  }

  // Show spinner while everything is loading
  function showSpinner() {
    Layout.render(<div className="esper-full-screen">
      <div className="esper-center">
        <div className="esper-spinner"></div>
      </div>
    </div>);
  }

  // Go to post-login redirect
  export function redirect(landingUrl?: string) {
    var landingUrl = landingUrl ? landingUrl : getLandingUrl();
    location.href = "/" + getLandingUrl();
  }

  function getLandingUrl() {
    var r = Util.getParamByName(Login.redirectParam);
    var ext = Util.getParamByName(Login.extParam);
    if (r) {
      r = Util.hexDecode(r);
      if (r[0] === "/") {
        r = r.slice(1);
      }
      return r;
    } else if (ext) {
      return EXT_REDIRECT;
    } else {
      return DEFAULT_REDIRECT;
    }
  }

  function getEmail() {
    return Util.nullify(Util.getParamByName(Login.emailParam));
  }

  function getInviteCode() {
    return Util.nullify(Util.getParamByName(Login.inviteParam));
  }

  function renderLogin(message?: string, error?: string) {
    var ext = Util.getParamByName(Login.extParam);
    var platform = Util.getParamByName(Login.platformParam);
    Layout.render(<div id="esper-login-container" className="container">
      <div className="panel panel-default"><div className="panel-body">
        <Components.LoginPrompt
          landingUrl={getLandingUrl()}
          inviteCode={getInviteCode()}
          email={getEmail()}
          platform={platform}
          showGoogle={true}
          showExchange={!ext}
          showNylas={!ext}>
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
        { showStagingLogin() ? <a onClick={renderStagingLogin}>
          Staging Login
        </a> : null }
      </div></div>
    </div>);
  }

  function handleLoginInfo(response: JQueryPromise<ApiT.LoginResponse>) {
    response
    .then(function(response) {
      Login.setCredentials(response.uid, response.api_secret);
      Login.setLoginInfo(response);
      return response;
    })

    // Check if we need approval
    .then(function(response) {
      var dfd = $.Deferred<ApiT.LoginResponse>();
      if (Login.needApproval(response)) {
        Layout.renderModal(<Views.ApproveTeamsModal info={response}
          callback={(info, rejected) => {
            var teamIds = _.map(rejected, (t) => t.teamid);
            Login.ignoreTeamIds(teamIds);
            dfd.resolve(info);
          }} />);
        return dfd.promise();
      }
      return response;
    })

    .then(function(response) {
      Login.storeCredentials(response);
      return response;
    })

    // Store info, then make second call to Google if necessary
    .then(function(response) {
      if (Login.usesGoogle(response)) {
        return Login.checkGooglePermissions(getLandingUrl())
          .then(function(ok) {
            return response;
          });
      }
      return response;
    })

    .then(function(response) {
      redirect(response.landing_url);
    }, function(err) {
      var errMsg = "There was an error logging you in."
      if (err === Login.MISSING_NONCE) {
        errMsg += (" If you are using Safari, please try using a " +
          "different browser. If you are in Incognito or Private Mode, " +
          "please try disabling it.");
      }
      renderLogin("", errMsg);
    });
  }


  /* Staging Login */

  function showStagingLogin() {
    return !PRODUCTION || location.hostname === "staging.esper.com";
  }

  function renderStagingLogin() {
    Layout.render(<div id="esper-login-container">
      <StagingLogin />
    </div>);
  }

  class StagingLogin extends ReactHelpers.Component<{}, {}> {
    _email: HTMLInputElement;
    _uid: HTMLInputElement;
    _apiSecret: HTMLInputElement;

    render() {
      return <div style={{textAlign: "left"}}>
        <div className="form-group">
          <label htmlFor={this.getId("eMail")}>E-mail</label>
          <input id={this.getId("eMail")} type="text"
            ref={(c) => this._email = c}
            defaultValue="lois@esper.com"
            className="form-control" />
        </div>
        <div className="form-group">
          <label htmlFor={this.getId("uid")}>UID</label>
          <input id={this.getId("uid")} type="text"
            ref={(c) => this._uid = c}
            defaultValue="O-w_lois_____________w"
            className="form-control" />
        </div>
        <div className="form-group">
          <label htmlFor={this.getId("uid")}>API Secret</label>
          <input id={this.getId("apiSecret")} type="password"
            ref={(c) => this._apiSecret = c}
            defaultValue="lois_secret"
            className="form-control" />
        </div>
        <div className="form-group">
          <button className="btn btn-primary" style={{width: "100%"}}
                  onClick={() => this.handleLogin()}>
            Login
          </button>
        </div>
      </div>;
    }

    componentDidMount() {
      $(this._email).focus();
    }

    handleLogin() {
      var email: string = $(this._email).val();
      var uid: string = $(this._uid).val();
      var apiSecret: string = $(this._apiSecret).val();

      Login.storeCredentials({
        email: email,
        uid: uid,
        api_secret: apiSecret
      });
      Esper.redirect();
    }
  }
}

Esper.init();
