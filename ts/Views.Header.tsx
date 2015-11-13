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
            <a className="navbar-brand lg" href="/#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>
          <form className="navbar-form navbar-left" role="search">
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Search"/>
            </div>
            <button type="submit" className="btn btn-default">Submit</button>
          </form>
          <div className="nav navbar-nav navbar-right">
            <Components.LoginInfo />
          </div>
        </div>
      </nav>;
    }
  }
}
