/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.Login.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    render() {
      return <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <a className="navbar-brand" href="/#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>

          <ul className="nav navbar-nav navbar-right">
            <li><Components.LoginInfo /></li>
          </ul>
        </div>
      </nav>;
    }
  }
}
