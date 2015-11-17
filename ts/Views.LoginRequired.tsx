/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Login.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class LoginRequired extends Component<{}, {}> {
    submitLogin = (e) => {
      e.preventDefault();
      var email = document.forms["login"]["email"].value;
      var password = document.forms["login"]["password"].value;
    }

    render() {
      return <div className="container">
        <h2>Sign In</h2>
        <form name="login">
          <div className="form-group">
            <input type="email" name="email" className="form-control" placeholder="Email" style={{ width: "30%" }}/>
          </div>
          <div className="form-group">
            <input type="password" name="password" className="form-control" placeholder="Password" style={{ width: "30%" }}/>
          </div>
          <button type="submit" onClick={this.submitLogin}
            className="btn btn-default">Submit</button>
        </form>
        <div>
          <a href={Login.loginURL() }>Or Login with Google / Microsoft.</a>
        </div>
      </div>;
    }
  }
}
