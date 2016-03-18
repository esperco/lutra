/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Header extends Component<{}, {
    open: boolean;
  }> {
    constructor(props: {}) {
      super(props);
      this.state = { open: false };
    }

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
            <button type="button" className={"navbar-toggle collapsed " +
              (this.state.open ? "open " : "")}
              onClick={this.toggleCollapse.bind(this)}
              data-toggle="collapse"
              data-target={this.getId(toggleId)}>
              <i className={"fa " + (this.state.open ? "fa-times" : "fa-bars")} />
            </button>
            <a className="navbar-brand lg" href="#!/">
              <img alt="Esper" src="/img/esper-logo-purple.svg" />
            </a>
          </div>

          <div className={"esper-collapse" + (this.state.open ? " open" : "")}
               id={this.getId(toggleId)}
               onClick={() => this.toggleCollapse()}>
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
              <NavLink href="/labels">
                <i className="fa fa-fw fa-tags"></i>{" "}Labels
              </NavLink>
            </ul> : null }

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
      </nav>;
    }

    toggleCollapse() {
      this.setState({ open: !this.state.open });
    }

    loginLinks() {
      return [
        <li key="0"><a href="#!/notification-settings">
          <i className="fa fa-fw fa-exchange"></i>{" "}
          Notification Settings
        </a></li>,
        <li key="1" className="divider" />,
        <li key="2"><a href="/" target="_blank">
          <i className="fa fa-fw fa-home"></i>{" "}
          Home
        </a></li>,
        <li key="3"><a href="/contact" target="_blank">
          <i className="fa fa-fw fa-envelope"></i>{" "}
          Contact Us
        </a></li>,
        <li key="4"><a href="/privacy-policy" target="_blank">
          <i className="fa fa-fw fa-lock"></i>{" "}
          Privacy
        </a></li>,
        <li key="5"><a href="/terms-of-use" target="_blank">
          <i className="fa fa-fw fa-legal"></i>{" "}
          Terms
        </a></li>,
        <li key="6"><a onClick={
            () => { Layout.renderModal(<Components.Invite />) }
          }>
          <i className="fa fa-fw fa-users"></i>{" "}
          Invite Your Contacts
        </a></li>,
        <li key="7" className="divider" />,
        <li key="8"><a onClick={() => Login.goToLogout()}>
          <i className="fa fa-fw fa-sign-out"></i>{" "}
          Logout
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
