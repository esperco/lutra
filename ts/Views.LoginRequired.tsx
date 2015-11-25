/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Store.ts" />
/// <reference path="./Views.Register.tsx" />
/// <reference path="./Views.ForgotPass.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface State {
    error: boolean;
    success: boolean;
    msg: string;
  }

  export class LoginRequired extends Component<State, State> {
    constructor(props: any) {
      super(props)
      if (props.error === undefined) {
        this.state = { error: false, success: false, msg: "" };
      } else {
        this.state = props;
      }
    }

    submitLogin = (e: React.SyntheticEvent) => {
      var self = this;
      e.preventDefault();
      var email = this.find("input[name='email']").val();
      var password = this.find("input[name='password']").val();
      Api.postDirLogin({ email, password })
        .done(function(loginResponse) {
          Store.set("uid", loginResponse.uid);
          Store.set("api_secret", loginResponse.api_secret);
          window.location.reload();
        })
        .fail(function(err: ApiT.Error) {
          if (err['status'] === 400) {
            self.setState({ error: true, success: false, msg: "Not a valid email address." });
          } else {
            self.setState({ error: true, success: false, msg: err.responseText });
          }
        });
    }

    showError = () => {
      return <div className="alert alert-danger" role="alert">
        <span className="glyphicon glyphicon-exclamation-sign"></span>
        <span className="sr-only">Error: </span>
        &nbsp;{this.state.msg}
      </div>;
    }

    showSuccess = () => {
      return <div className="alert alert-success" role="alert">
        <span className="glyphicon glyphicon-ok"></span>
        <span className="sr-only">Success: </span>
        &nbsp;{this.state.msg}
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
        {(this.state.success === true) ? this.showSuccess() : ""}
        <div>
          New User?
          <a onClick={() => Layout.render(<Views.Register />)}>{" Sign Up Here"}</a>
          </div>
        <div>
          <a href={Login.loginURL()}>Or Login with Google / Microsoft.</a>
        </div>
        <div>
          <a onClick={() => Layout.render(<Views.ForgotPass />)}>Forgot Password?</a>
          </div>
      </div>;
    }
  }
}
