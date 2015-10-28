/*
  Displays login info or link to login via Otter
*/

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
        return <p className="navbar-text">{this.state.loginInfo.email}</p>;
      }

      // Double encode URI because of pageJs issue (see Otter's Route.ts)
      var domain = encodeURIComponent(encodeURIComponent(location.href));
      var redirect = Api.prefix + "/#!/login-redirect/" + domain;
      return <a href={redirect}>Login / Signup</a>;
    }

    componentDidMount() {
      this.setSources([
        Login.InfoStore
      ]);
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