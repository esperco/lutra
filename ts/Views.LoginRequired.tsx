/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Login.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class LoginRequired extends Component<{}, {}> {
    render() {

      return <div id="login-required-page" className="esper-full-screen padded">
        <div className="esper-focus-message">
          <div>
            <h2>
              View your calendar breakdown.<br />
              Get actionable insights.
            </h2>
            <img src="img/TimeStats.gif"
                 className="onboarding-img"
                 onClick={this.goToLogin.bind(this)}
                 style={{width: "100%", height: "auto"}} />
            <p>
              <button className="btn btn-primary"
                      onClick={this.goToLogin.bind(this)}>
                Login or Signup to Continue
              </button>
            </p>
          </div>
        </div>
      </div>;
    }

    goToLogin() {
      location.href = Login.loginURL();
    }
  }
}

