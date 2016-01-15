/*
  Displays login info or link to login via Otter
*/

/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Invite.tsx" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../common/Login.ts" />

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
          <a className="dropdown-toggle" data-toggle="dropdown">
            {this.state.loginInfo.email}{" "}
            <span className="caret"></span>
          </a>
          <ul className="dropdown-menu">
            <li><a onClick={() => Login.goToLogout()}>
              <i className="fa fa-fw fa-sign-out"></i>{" "}
              Logout
            </a></li>
            <li><a onClick={
                () => { Layout.renderModal(<Components.Invite />) }
              }>
              Invite your contacts!
            </a></li>
          </ul>
        </div>;
      }

      return <button className="btn btn-default navbar-btn"
        onClick={() => Login.goToLogin()}>
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
      var loginInfo = tuple && tuple[0];
      var metadata = tuple && tuple[1];
      return {
        loginInfo: loginInfo,
        busy: metadata && metadata.dataStatus !== Model.DataStatus.READY
      };
    }
  }
}
