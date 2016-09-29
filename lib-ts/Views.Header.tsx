/*
  Generic header view for logged in users
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
/// <reference path="./Components.SidebarWithToggle.tsx" />
/// <reference path="./Components.Tooltip.tsx" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./Text.tsx" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {}> {
    _navSidebar: Components.Sidebar;

    renderWithData() {
      var loginInfo = Login.getLoginInfo();
      var busy = Login.getStatus() !== Model2.DataStatus.READY;
      var hasTeams = Stores.Teams.all().length > 0;

      return <div className="navbar-fixed-top">
        <nav className="navbar navbar-default navbar-shadow">
          <div className="container-fluid">
            <div className="navbar-header">
              <Components.SidebarToggle side="left" className="navbar-toggle">
                <i className="fa fa-fw fa-bars" />
              </Components.SidebarToggle>
              <SaveIndicator>
                <a className={classNames("navbar-brand lg", {
                  "navbar-square": hasTeams
                })} href="#!/">
                  <img alt="Esper" src="/img/esper-logo-purple.svg" />
                </a>
                { hasTeams ? null :
                  <a href="/" className="navbar-brand word-mark hidden-xs">
                    <img className="logo-name" src="img/word-mark.svg" />
                  </a>
                }
              </SaveIndicator>
              <Components.SidebarToggle side="right" className="navbar-toggle">
                <i className="fa fa-fw fa-ellipsis-h" />
              </Components.SidebarToggle>
            </div>

            <div className="hidden-xs">
              { hasTeams ? loginInfo.match({
                none: () => null,
                some: () => this.navLinks("nav navbar-nav")
              }) : null}

              <div className="navbar-text pull-right">
                <Components.LoginInfo loginInfo={loginInfo} busy={busy}>
                  { this.loginLinks("esper-select-menu") }
                </Components.LoginInfo>
              </div>
            </div>

            <Components.Sidebar
              ref={(c) => this._navSidebar = c}
              className="visible-xs-block navbar-default"
              side="right"
            >
              <div className="esper-section">
                { this.navLinks(
                  "nav navbar-nav esper-panel-section esper-full-width"
                ) }
                { this.loginLinks(
                  "nav navbar-nav esper-panel-section esper-full-width"
                ) }
              </div>
            </Components.Sidebar>
          </div>
        </nav>
      </div>;
    }

    toggleNavSidebar() {
      if (this._navSidebar) {
        this._navSidebar.toggle();
      }
    }

    navLinks(className?: string) {
      return <ul className={className} onClick={() => this.toggleNavSidebar()}>
        <NavLink path={Paths.Time.charts({})}>
          <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
        </NavLink>
        <NavLink path={Paths.Time.calendarLabeling({})} hiddenXs={true}>
          <i className="fa fa-fw fa-calendar"></i>{" "}Calendar
        </NavLink>
        <NavLink path={Paths.Time.list({})}>
          <i className="fa fa-fw fa-th-list"></i>{" "}Event List
        </NavLink>
        { Login.data.is_sandbox_user ?
          <NavLink path={Paths.Login.home()} className="sandbox-sign-up">
            <i className="fa fa-fw fa-arrow-right"></i>{" "}Sign Up
          </NavLink> :
          <NavLink path={Paths.Manage.home()}>
            <i className="fa fa-fw fa-cog"></i>{" "}Settings
          </NavLink> }
      </ul>;
    }

    loginLinks(className?: string) {
      return <ul className={className}>
        <li><a href={Paths.Landing.home().href} target="_blank">
          <i className="fa fa-fw fa-home"></i>{" "}
          Home
        </a></li>
        <li><a href={Paths.Landing.contact().href} target="_blank">
          <i className="fa fa-fw fa-envelope"></i>{" "}
          Contact Us
        </a></li>
        <li><a href={Paths.Landing.privacy().href} target="_blank">
          <i className="fa fa-fw fa-lock"></i>{" "}
          Privacy
        </a></li>
        <li><a href={Paths.Landing.terms().href} target="_blank">
          <i className="fa fa-fw fa-legal"></i>{" "}
          Terms
        </a></li>
        <li className="divider" />
        <li><a onClick={() => Login.goToLogout()}>
          <i className="fa fa-fw fa-sign-out"></i>{" "}
          Log out
          <span className="visible-xs-inline">
            {" of "}{Login.myEmail()}
          </span>
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
        <a href={this.props.path.href} className={this.props.className}>
          {this.props.children}
        </a>
      </li>;
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
