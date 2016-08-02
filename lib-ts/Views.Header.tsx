/*
  Generic header view for logged in users
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.ReleaseNotes.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
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

  export class Header extends Component<Props, {
    open: boolean;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = { open: false };
    }

    renderWithData() {
      var toggleId = "esper-nav-toggle";
      var loginInfo = Login.getLoginInfo();
      var busy = Login.getStatus() !== Model2.DataStatus.READY;

      var hasTeams = Stores.Teams.all().length > 0;

      return <div className="navbar-fixed-top">
        <ReleaseNotes lastDismiss={Stores.ReleaseNotes.get()} />
        <nav className="navbar navbar-default navbar-shadow">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button" className={"navbar-toggle collapsed " +
                (this.state.open ? "open " : "")}
                onClick={this.toggleCollapse.bind(this)}
                data-toggle="collapse"
                data-target={this.getId(toggleId)}>
                <i className={"fa " +
                   (this.state.open ? "fa-times" : "fa-bars")} />
              </button>
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
            </div>

            <div className={"esper-collapse" + (this.state.open ? " open" : "")}
                 id={this.getId(toggleId)}
                 onClick={() => this.toggleCollapse()}>
              { hasTeams ? loginInfo.match({
                none: () => null,
                some: () => <ul className="nav navbar-nav">
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
                </ul>
              }) : null}

              <div className="nav navbar-nav navbar-right">
                <div className="navbar-text hidden-xs">
                  <Components.LoginInfo loginInfo={loginInfo} busy={busy}>
                    { this.loginLinks() }
                  </Components.LoginInfo>
                </div>
                <ul className="visible-xs-block esper-select-menu">
                  { this.loginLinks() }
                </ul>
              </div>
            </div>
          </div>
          {
            this.state.open ?
            <div className="esper-collapse-backdrop"
                 onClick={() => this.toggleCollapse()} /> :
            null
          }
        </nav>
      </div>;
    }

    toggleCollapse() {
      this.setState({ open: !this.state.open });
    }

    loginLinks() {
      return [
        <li key="0"><a href={Paths.Landing.home().href} target="_blank">
          <i className="fa fa-fw fa-home"></i>{" "}
          Home
        </a></li>,
        <li key="1"><a href={Paths.Landing.contact().href} target="_blank">
          <i className="fa fa-fw fa-envelope"></i>{" "}
          Contact Us
        </a></li>,
        <li key="2"><a href={Paths.Landing.privacy().href} target="_blank">
          <i className="fa fa-fw fa-lock"></i>{" "}
          Privacy
        </a></li>,
        <li key="3"><a href={Paths.Landing.terms().href} target="_blank">
          <i className="fa fa-fw fa-legal"></i>{" "}
          Terms
        </a></li>,
        <li key="4" className="divider" />,
        <li key="5"><a onClick={() => Login.goToLogout()}>
          <i className="fa fa-fw fa-sign-out"></i>{" "}
          Log out
          <span className="visible-xs-inline">
            {" of "}{Login.myEmail()}
          </span>
        </a></li>
      ];
    }

    componentDidMount() {
      Route.onBack(this.onBack);
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      Route.offBack(this.onBack);
    }

    onBack = () => {
      if (this.state.open) {
        this.setState({open: false});
        return false;
      }
      return true;
    }
  }

  class ReleaseNotes extends Component<{ lastDismiss: number }, {}> {
    render() {
      if (this.props.lastDismiss < Text.LatestRelease) {
        return (
        <div className="esper-release-notes esper-inverse text-center pinned">
          <a className="action rm-action pull-right"
             title={Text.DismissNotes}
             onClick={this.dismissReleaseNotes.bind(this)}>
            <i className="fa fa-fw fa-close list-group-item-text" />
          </a>
          { Text.ReleaseNotes }
        </div>);
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
        return <span className="navbar-square">
          <span className="esper-spinner" />
        </span>;
      }
      if (this.state.error) {
        return <span className="navbar-square">
          <Components.Tooltip className="esper-save-error text-danger"
                              title={Text.DefaultErrorTooltip}
                              placement="right">
            <i className="fa fa-fw fa-warning" />
          </Components.Tooltip>
        </span>;
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
