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

  export class Header extends Component<{
    teamId?: string;
  }, {}> {
    renderWithData() {
      let hasTeams = Stores.Teams.all().length > 0;
      return <header className="navbar-fixed-top">
        <nav className="navbar navbar-default navbar-shadow">
          <div className="container-fluid navbar-container">
            <div className="navbar-header">
              <SaveIndicator>
                <a className={classNames("navbar-brand lg", {
                  "navbar-square": !!(hasTeams && this.props.teamId)
                })} href="#!/">
                  <img alt="Esper" src="/img/esper-logo-purple.svg" />
                </a>

                {/* Show team switcher always if applicable */}
                { hasTeams && this.props.teamId ?
                  this.teamSwitcher() :
                  <a href="/" className="navbar-brand word-mark hidden-xs">
                    <img className="logo-name" src="img/word-mark.svg" />
                  </a> }
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

    teamSwitcher() {
      let teams = Stores.Teams.all();
      let teamId = this.props.teamId || "";
      let selectedTeam = _.find(teams, (t) => t.teamid === teamId);
      let displayName = selectedTeam ? selectedTeam.team_name : Text.NoTeam;
      return <Components.Dropdown className="dropdown team-switcher">
        <h1 className="dropdown-toggle">
          { displayName }{" "}
          <i className="fa fa-fw fa-caret-down" />
        </h1>
        <div className="dropdown-menu">
          <div className="esper-select-menu team-list">
            { _.map(teams,
              (t) => <span key={t.teamid} className={classNames(
                "esper-selectable", { active: this.props.teamId === t.teamid }
              )}>
                <a href={ Paths.Time.charts({ teamId: t.teamid }).href }>
                  { t.teamid === this.props.teamId ?
                    <i className="fa fa-fw fa-left fa-check" /> :
                    <i className="fa fa-fw fa-left fa-user" /> }
                  { t.team_name }
                </a>{" "}
                <a className="pull-right"
                  href={ Paths.Manage.Team.general({ teamId: t.teamid }).href }>
                  <i className="fa fa-fw fa-cog" />
                </a>
              </span>) }
          </div>
          <div className="esper-select-menu">
            <a className="esper-selectable"
               href={ Paths.Manage.newTeam().href }>
              <i className="fa fa-fw fa-left fa-plus" />
              { Text.AddTeamLink }
            </a>
          </div>
          <div className="esper-select-menu">
            <a className="esper-selectable"
               href={ Paths.Groups.home().href }>
              <i className="fa fa-fw fa-left fa-users" />
              { Text.GroupsLink }
            </a>
          </div>
        </div>
      </Components.Dropdown>;
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
        <NavLink path={Paths.Feedback.home()}>
          <i className="fa fa-fw fa-star"></i>
          <span>{" "}Ratings</span>
        </NavLink>
        <NavLink path={Paths.Timebomb.home()}>
          <i className="fa fa-fw fa-check"></i>
          <span>{" "}Agenda Check</span>
        </NavLink>
        <NavLink path={Paths.Time.home()}>
          <i className="fa fa-fw fa-pie-chart"></i>
          <span>{" "}Charts</span>
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

