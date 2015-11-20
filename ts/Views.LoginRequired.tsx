/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Store.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface State {
    error: boolean;
  }

  export class LoginRequired extends Component<{}, State> {
    constructor(props: any) {
      super(props)
      this.state = { error: false };
    }

    submitLogin = (e: React.SyntheticEvent) => {
      var self = this;
      e.preventDefault();
      var email = document.forms["login"]["email"].value;
      var password = document.forms["login"]["password"].value;
      Api.postDirLogin({ email, hash_pwd: password })
        .done(function(loginResponse) {
          Store.set("uid", loginResponse.uid);
          Store.set("api_secret", loginResponse.api_secret);
          window.location.reload();
        })
        .fail(function(err: Error) {
          self.setState({ error: true });
        });
    }

    showError = () => {
      return <div className="alert alert-danger" role="alert">
        <span className="glyphicon glyphicon-exclamation-sign"></span>
        <span className="sr-only">Error: </span>
        &nbsp;Email or password incorrect
      </div>;
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
        {(this.state.error === true) ? this.showError() : ""}
        <div>
          New User?
          <a href={Login.loginURL()}>{" Sign Up Here"}</a>
          </div>
        <div>
          <a href={Login.loginURL()}>Or Login with Google / Microsoft.</a>
        </div>
      </div>;
    }
  }
}
