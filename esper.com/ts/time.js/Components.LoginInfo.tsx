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
            <li><a href="#!/notification-settings">
              <i className="fa fa-fw fa-exchange"></i>{" "}
              Notification Settings
            </a></li>
            <li className="divider" />
            <li><a href="/" target="_blank">
              <i className="fa fa-fw fa-home"></i>{" "}
              Home
            </a></li>
            <li><a href="/contact" target="_blank">
              <i className="fa fa-fw fa-envelope"></i>{" "}
              Contact Us
            </a></li>
            <li><a href="/privacy-policy" target="_blank">
              <i className="fa fa-fw fa-lock"></i>{" "}
              Privacy
            </a></li>
            <li><a href="/terms-of-use" target="_blank">
              <i className="fa fa-fw fa-legal"></i>{" "}
              Terms
            </a></li>
            <li><a onClick={
                () => { Layout.renderModal(<Components.Invite />) }
              }>
              <i className="fa fa-fw fa-users"></i>{" "}
              Invite Your Contacts
            </a></li>
            <li className="divider" />
            <li><a onClick={() => Login.goToLogout()}>
              <i className="fa fa-fw fa-sign-out"></i>{" "}
              Logout
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
