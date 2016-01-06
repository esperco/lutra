/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Components.Search.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    render() {
      return <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <a className="navbar-brand lg" href="/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>
          <Components.Search />
          <div className="nav navbar-nav navbar-right">
            <Components.LoginInfo />
          </div>
        </div>
      </nav>;
    }
  }
}
