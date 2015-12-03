/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.Login.tsx" />
/// <reference path="./Components.Onboarding.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Components {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    render() {
      var toggleId = "esper-nav-toggle";
      return <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target={this.getId(toggleId)}>
              <i className="fa fa-bars"></i>
            </button>
            <a className="navbar-brand lg" href="/#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>

          <div className="collapse navbar-collapse" id={this.getId(toggleId)}>
            <ul className="nav navbar-nav">
              <NavLink href="/labels-over-time">
                <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
              </NavLink>
              <NavLink href="/calendar-labeling">
                <i className="fa fa-fw fa-tags"></i>{" "}Label Events
              </NavLink>
              <li>
                <a onClick={this.openHelpModal.bind(this)}>
                  <i className="fa fa-fw fa-question-circle" />
                </a>
              </li>
            </ul>

            <div className="nav navbar-nav navbar-right">
              <Components.LoginInfo />
            </div>
          </div>

        </div>
      </nav>;
    }

    openHelpModal() {
      Layout.renderModal(<Components.GifModal />);
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
        <a href={Route.nav.href(this.props.href)}>
          {this.props.children}
        </a>
      </li>;
    }
  }
}
