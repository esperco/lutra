/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Components.Onboarding.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface HeaderState {
    loginInfo: ApiT.LoginResponse;
  }

  export class Header extends Component<{}, HeaderState> {
    render() {
      var toggleId = "esper-nav-toggle";
      return <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed"
              onClick={this.toggleCollapse.bind(this)}
              data-toggle="collapse"
              data-target={this.getId(toggleId)}>
              <i className="fa fa-bars"></i>
            </button>
            <a className="navbar-brand lg" href="/#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>

          <div className="collapse navbar-collapse" id={this.getId(toggleId)}>
            { this.state.loginInfo ? <ul className="nav navbar-nav">
              <NavLink href="/labels-over-time">
                <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
              </NavLink>
              <NavLink href="/calendar-labeling">
                <i className="fa fa-fw fa-tags"></i>{" "}Label Events
              </NavLink>
              <li>
                <a onClick={this.openHelpModal.bind(this)}>
                  <i className="fa fa-fw fa-question-circle" />
                  <span className="visible-xs-inline">{" "}How To</span>
                </a>
              </li>
            </ul> : null }

            <div className="navbar-right">
              <Components.LoginInfo />
            </div>
          </div>

        </div>
      </nav>;
    }

    openHelpModal() {
      Layout.renderModal(<Components.GifModal />);
    }

    componentDidMount() {
      this.setSources([
        Login.InfoStore
      ]);
      this.find('.collapse').collapse({
        toggle: false
      });
    }

    toggleCollapse() {
      this.find('.collapse').collapse('toggle');
    }

    getState() {
      return {
        loginInfo: Login.InfoStore.val()
      };
    }
  }

  interface NavLinkProps {
    href: string;
    children?: JSX.Element[];
  }

  class NavLink extends Component<NavLinkProps, {}> {
    render() {
      var selected = Route.nav.isActive(this.props.href);
      return <li className={(selected ? "active" : "")}>
        <a onClick={() => Route.nav.path(this.props.href)}>
          {this.props.children}
        </a>
      </li>;
    }
  }
}
