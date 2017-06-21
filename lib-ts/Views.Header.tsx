/*
  Generic header view for logged in users
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Components.Tooltip.tsx" />
/// <reference path="./Login.Web.ts" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./Text.tsx" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    _navSidebar: Components.Sidebar;

    renderWithData() {
      let loginInfo = Login.getLoginInfo();
      let busy = Login.getStatus() !== Model2.DataStatus.READY;
      let hasTeams = Stores.Teams.all().length > 0;
      let hasGroups = loginInfo.mapOr(false, (l) => l.groups.length > 0);
      let isSettingsPage = Route.nav.isActive(Paths.Manage.home());

      let showTeamHeaders = (() => {
        if (! hasTeams) return false;
        if (! hasGroups) return true;
        if (! isSettingsPage) return true;
        if (Route.nav.isActive(Paths.Manage.Team.base()) ||
            Route.nav.isActive(Paths.Manage.newTeam())) return true;
        return false;
      })();
      let showGroupHeaders = hasGroups && isSettingsPage && !showTeamHeaders;

      return <header className="navbar-fixed-top">
        <nav className="navbar navbar-default navbar-shadow">
          <div className="container-fluid">
            <div className="navbar-header">
              <SaveIndicator>
                <a className={classNames("navbar-brand lg", {
                  "navbar-square": hasTeams
                })} href="#!/">
                  <img alt="Esper" src="/img/esper-logo-purple.svg" />
                </a>
                { (showTeamHeaders || showGroupHeaders) ? null :
                  <a href="/" className="navbar-brand word-mark hidden-xs">
                    <img className="logo-name" src="img/word-mark.svg" />
                  </a>
                }
              </SaveIndicator>
            </div>
            <div>
              { this.navLinks("nav navbar-nav") }
              { this.dropdown() }
            </div>
          </div>
        </nav>
      </header>;
    }

    toggleNavSidebar() {
      if (this._navSidebar) {
        this._navSidebar.toggle();
      }
    }

    navLinks(className?: string) {
      if (Login.data.is_sandbox_user) {
        return <ul className={className}>
          <NavLink path={Paths.Login.home()} className="sandbox-sign-up">
            <i className="fa fa-fw fa-arrow-right"></i>
            <span>{" "}Sign Up</span>
          </NavLink>
        </ul>;
      }

      return <ul className={className}>
        <NavLink path={Paths.Time.home()}>
          <i className="fa fa-fw fa-pie-chart"></i>
          <span>{" "}Charts</span>
        </NavLink>
        <NavLink path={Paths.Timebomb.home()}>
          <i className="fa fa-fw fa-check"></i>
          <span>{" "}Agenda Check</span>
        </NavLink>
      </ul>;
    }

    dropdown() {
      return <Components.Dropdown className="dropdown">
        <a className="dropdown-toggle navbar-link">
          <i className="fa fa-fw fa-ellipsis-v" />
        </a>
        <div className="dropdown-menu">
          { this.menu("esper-select-menu") }
        </div>
      </Components.Dropdown>;
    }

    menu(className?: string) {
      return <ul className={className}>
        <li className="login-info">{
          Login.data.is_sandbox_user ?
          "Demo User" : Login.myEmail()
        }</li>
        <li className="divider" />
        { Login.data.is_sandbox_user ? null :
          <li><a href={Paths.Settings.home().href} target="_blank">
            <i className="fa fa-fw fa-cog"></i>{" "}
            Settings
          </a></li> }
        <li><a href={Paths.Landing.contact().href} target="_blank">
          <i className="fa fa-fw fa-envelope"></i>{" "}
          Contact Us
        </a></li>
        <li><a onClick={() => Login.goToLogout()}>
          <i className="fa fa-fw fa-sign-out"></i>{" "}
          Sign out
        </a></li>
      </ul>;
    }
  }

  interface NavLinkProps {
    path: Paths.Path;
    className?: string;
    children?: JSX.Element[];
    hiddenXs?: boolean;
  }

  class NavLink extends Component<NavLinkProps, {}> {
    render() {
      return <li className={classNames({
        active: Route.nav.isActive(this.props.path),
        "hidden-xs": this.props.hiddenXs
      })}>
        <a href={this.props.path.href}
          className={this.props.className}
          onClick={this.onClick}
        >
          {this.props.children}
        </a>
      </li>;
    }

    onClick = (e: __React.MouseEvent) => {
      Route.nav.go(this.props.path);
      e.preventDefault();
    }
  }

  class SaveIndicator extends React.Component<{
    children?: JSX.Element[];
  }, Save.Status> {
    constructor(props: { children?: JSX.Element[] }) {
      super(props);
      this.state = { busy: false, error: false };
    }

    render() {
      if (this.state.busy) {
        return <span><span className="navbar-square">
          <span className="esper-spinner" />
        </span></span>;
      }
      if (this.state.error) {
        return <span><span className="navbar-square">
          <Components.Tooltip className="esper-save-error text-danger"
                              title={Text.DefaultErrorTooltip}>
            <i className="fa fa-fw fa-warning" />
          </Components.Tooltip>
        </span></span>;
      }
      return <span>
        { this.props.children }
      </span>
    }

    componentDidMount() {
      Save.Emitter.addChangeListener(this.onChange);
    }

    componentWillUnmount() {
      Save.Emitter.removeChangeListener(this.onChange);
    }

    // Arrow notation to create a single reference for change listener
    onChange = (status: Save.Status) => this.setState(status)
  }
}

