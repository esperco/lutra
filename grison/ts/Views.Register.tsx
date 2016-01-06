/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Login.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface State {
    error: boolean;
    success: boolean;
    msg: string;
  }

  export class Register extends Component<{}, State> {
    constructor(props: any) {
      super(props);
      this.state = { error: false, success:  false, msg: "" };
    }

    submitLogin = (e: React.SyntheticEvent) => {
      var self = this;
      e.preventDefault();
      var email = this.find("input[name='email']").val();
      var password = this.find("input[name='password']").val();
      var password2 = this.find("input[name='password2']").val();
      if (password !== password2 || password === "" || password2 === "") {
        this.setState({ error: true, success: false, msg: "Passwords don't match" })
        return;
      }
      Api.registerDirLogin({ email, password })
        .done(function(loginResponse) {
          self.setState({ error: false, success: true,
            msg: "Resitration successful. You should receive an email shortly." })
          Layout.render(<Views.LoginRequired error={self.state.error} success={self.state.success} msg={self.state.msg}/>);
        })
        .fail(function(err: ApiT.Error) {
          if (err['status'] === 400) {
            self.setState({ error: true, success: false, msg: "Not a valid email." });
          } else {
            self.setState({ error: true, success: false, msg: err.responseText });
          }
        });
    }

    showError = () => {
      return <div className="alert alert-danger" role="alert">
        <span className="glyphicon glyphicon-exclamation-sign"></span>
        <span className="sr-only">Error: </span>
        &nbsp; {this.state.msg}
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
        <h2>Register New User</h2>
        <form name="login">
          <div className="form-group">
            <input type="email" name="email" className="form-control" placeholder="Email" style={{ width: "30%" }}/>
          </div>
          <div className="form-group">
            <input type="password" name="password" className="form-control" placeholder="Password" style={{ width: "30%" }}/>
          </div>
          <div className="form-group">
            <input type="password" name="password2" className="form-control" placeholder="Confirm Password" style={{ width: "30%" }}/>
          </div>
          <button type="submit" onClick={this.submitLogin}
            className="btn btn-default">Submit</button>
        </form>
        {(this.state.error === true) ? this.showError() : ""}
        {(this.state.success === true) ? this.showSuccess() : ""}
        <div>
          <a onClick={this.goToLogin.bind(this)}>
            Or Login with Google / Microsoft
          </a>
        </div>
      </div>;
    }

    goToLogin() {
      Layout.renderModal(<Components.LoginModal />);
    }
  }
}
