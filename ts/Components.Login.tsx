/*
  Displays login info or link to login via Otter
*/
/// <reference path="../marten/typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Login.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LoginInfoState {
    loginInfo: ApiT.LoginResponse;
    busy: boolean;
  };

  export class LoginInfo extends Component<{}, LoginInfoState> {
    render() {
      if (this.state.busy) {
        return <div className="esper-spinner"></div>;
      }

      if (this.state.loginInfo) {
        return <div className="dropdown navbar-text">
          <a href="#" className="dropdown-toggle" data-toggle="dropdown">
            {this.state.loginInfo.email}{" "}
            <span className="caret"></span>
          </a>
          <ul className="dropdown-menu">
            <li><a href={Login.logoutURL()}>
              <i className="fa fa-fw fa-sign-out"></i>{" "}
              Logout
            </a></li>
          </ul>
        </div>;
      }

      // Double encode URI because of pageJs issue (see Otter's Route.ts)
      return <button className="btn btn-default navbar-btn"
        onClick={() => location.href=Login.loginURL()}>
        Login / Signup
      </button>;
    }

    componentDidMount() {
      this.setSources([
        Login.InfoStore
      ]);
      this.find('.dropdown-toggle').dropdown();
    }

    getState() {
      var tuple = Login.InfoStore.get();
      var loginInfo = tuple[0];
      var metadata = tuple[1];
      return {
        loginInfo: loginInfo,
        busy: metadata && metadata.dataStatus !== Model.DataStatus.READY
      };
    }
  }
}