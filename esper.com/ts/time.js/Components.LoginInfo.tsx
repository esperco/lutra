/*
  Displays login info or link to login via Otter
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Invite.tsx" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../common/Components.Dropdown.tsx" />
/// <reference path="../common/Login.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LoginInfoProps {
    loginInfo: ApiT.LoginResponse;
    busy: boolean;
  };

  export class LoginInfo extends Component<LoginInfoProps, {}> {
    render() {
      if (this.props.busy) {
        return <div className="esper-spinner"></div>;
      }

      if (this.props.loginInfo) {
        return <Dropdown className="dropdown navbar-text xs-open">
          <a className="dropdown-toggle">
            {this.props.loginInfo.email}{" "}
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
        </Dropdown>;
      }

      return <button className="btn btn-default navbar-btn"
        onClick={() => Login.goToLogin()}>
        Login / Signup
      </button>;
    }
  }
}
