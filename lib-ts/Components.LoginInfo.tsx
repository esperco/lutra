/*
  Displays login info or link to login via Otter
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Modal.tsx" />
/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Login.Web.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LoginInfoProps {
    loginInfo: ApiT.LoginResponse;
    busy: boolean;
    children?: JSX.Element[];
  };

  export class LoginInfo extends Component<LoginInfoProps, {}> {
    render() {
      if (this.props.busy) {
        return <div className="esper-spinner"></div>;
      }

      if (this.props.loginInfo) {
        return <Dropdown className="dropdown">
          <a className="dropdown-toggle navbar-link">
            {this.props.loginInfo.email}{" "}
            <span className="caret"></span>
          </a>
          <ul className="dropdown-menu">
            { this.props.children }
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
