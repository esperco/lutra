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
            <h2>Login Required.</h2>
            <p>
              You must{" "}
              <a href={Login.loginURL()}>login</a>
              {" "}to view this page.
            </p>
          </div>
        </div>
      </div>;
    }
  }
}

