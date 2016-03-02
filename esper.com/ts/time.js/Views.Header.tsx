/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    _navbarOpen: boolean;

    renderWithData() {
      var toggleId = "esper-nav-toggle";
      var loginInfo = Login.InfoStore.val();
      var busy = Option.cast(Login.InfoStore.metadata()).match({
        none: () => true,
        some: (m) => m.dataStatus !== Model.DataStatus.READY
      });

      return <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed"
              onClick={this.toggleCollapse.bind(this)}
              data-toggle="collapse"
              data-target={this.getId(toggleId)}>
              <i className="fa fa-bars"></i>
            </button>
            <a className="navbar-brand lg" href="#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>

          <div className="collapse navbar-collapse" id={this.getId(toggleId)}
               onClick={() => this._navbarOpen && this.toggleCollapse()}>
            { loginInfo ? <ul className="nav navbar-nav">
              <NavLink href="/charts">
                <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
              </NavLink>
              <NavLink href="/calendar-labeling" hiddenXs={true}>
                <i className="fa fa-fw fa-calendar"></i>{" "}Calendar
              </NavLink>
              <NavLink href="/list">
                <i className="fa fa-fw fa-th-list"></i>{" "}Event List
              </NavLink>
            </ul> : null }

            <div className="navbar-right">
              <Components.LoginInfo loginInfo={loginInfo} busy={busy} />
            </div>
          </div>

        </div>
      </nav>;
    }

    componentDidMount() {
      this.find('.collapse').collapse({
        toggle: false
      });
    }

    toggleCollapse() {
      this.find('.collapse').collapse('toggle');
      this._navbarOpen = !this._navbarOpen;
    }
  }

  interface NavLinkProps {
    href: string;
    children?: JSX.Element[];
    hiddenXs?: boolean;
  }

  class NavLink extends Component<NavLinkProps, {}> {
    render() {
      var selected = Route.nav.isActive(this.props.href);
      return <li className={(selected ? "active" : "") +
        (this.props.hiddenXs ? " hidden-xs" : "")
      }>
        <a onClick={() => Route.nav.path(this.props.href)}>
          {this.props.children}
        </a>
      </li>;
    }
  }
}
