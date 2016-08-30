/*
  Generic header view for logged in users
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.ReleaseNotes.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
/// <reference path="./Components.SidebarWithToggle.tsx" />
/// <reference path="./Components.Tooltip.tsx" />
/// <reference path="./Text.tsx" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Namespace for Header related vars
  export module Header_ {
    export enum Tab {
      Charts = 1,
      Calendar,
      List,
      Manage
    }
  }

  interface Props {
    active?: Header_.Tab
  }

  export class Header extends Component<Props, {}> {
    _navSidebar: Components.Sidebar;

    renderWithData() {
      var loginInfo = Login.getLoginInfo();
      var busy = Login.getStatus() !== Model2.DataStatus.READY;
      var hasTeams = Stores.Teams.all().length > 0;

      return <div className="navbar-fixed-top">
        <ReleaseNotes lastDismiss={Stores.ReleaseNotes.get()} />
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
              { this.navLinks(
                "nav navbar-nav esper-panel-section esper-full-width"
              ) }
              { this.loginLinks(
                "nav navbar-nav esper-panel-section esper-full-width"
              ) }
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
        <NavLink href={Paths.Time.charts({}).href}
                 active={this.props.active === Header_.Tab.Charts}>
          <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
        </NavLink>
        <NavLink href={Paths.Time.calendarLabeling({}).href}
                 active={this.props.active === Header_.Tab.Calendar}
                 hiddenXs={true}>
          <i className="fa fa-fw fa-calendar"></i>{" "}Calendar
        </NavLink>
        <NavLink href={Paths.Time.list({}).href}
                 active={this.props.active === Header_.Tab.List}>
          <i className="fa fa-fw fa-th-list"></i>{" "}Event List
        </NavLink>
        <NavLink href={Paths.Manage.home().href}
                 active={this.props.active === Header_.Tab.Manage}>
          <i className="fa fa-fw fa-cog"></i>{" "}Settings
        </NavLink>
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

  class ReleaseNotes extends Component<{ lastDismiss: number }, {}> {
    render() {
      if (this.props.lastDismiss < Text.LatestRelease) {
        return <div className="esper-release-notes esper-inverse pinned">
          <a className="action rm-action pull-right"
             title={Text.DismissNotes}
             onClick={this.dismissReleaseNotes.bind(this)}>
            <i className="fa fa-fw fa-close list-group-item-text" />
          </a>
          { Text.ReleaseNotes }
        </div>;
      }
      return null;
    }

    dismissReleaseNotes() {
      Stores.ReleaseNotes.set(Date.now());
      Route.nav.refresh();
    }
  }

  interface NavLinkProps {
    href: string;
    children?: JSX.Element[];
    hiddenXs?: boolean;
    active?: boolean;
  }

  class NavLink extends Component<NavLinkProps, {}> {
    render() {
      var selected = Route.nav.isActive(this.props.href);
      return <li className={classNames({
        active: this.props.active,
        "hidden-xs": this.props.hiddenXs
      })}>
        <a href={this.props.href}>
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
                              title={Text.DefaultErrorTooltip}
                              placement="right">
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
