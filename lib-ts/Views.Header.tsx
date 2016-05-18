/*
  Generic header view for loggedi nu sers
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Components.LoginInfo.tsx" />
/// <reference path="./Text.ts" />

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
      var loginInfo = Login.getLoginInfo();
      var busy = Login.getStatus() !== Model2.DataStatus.READY;

      return <nav
              className="navbar navbar-default navbar-shadow navbar-fixed-top">
        <div className="container-fluid padded">
          <div className="navbar-header">
            <button type="button" className={"navbar-toggle collapsed " +
              (this.state.open ? "open " : "")}
              onClick={this.toggleCollapse.bind(this)}
              data-toggle="collapse"
              data-target={this.getId(toggleId)}>
              <i className={"fa " +
                 (this.state.open ? "fa-times" : "fa-bars")} />
            </button>
            <span className="navbar-square">
              <SaveIndicator>
                <a className="navbar-brand lg" href="#!/">
                  <img alt="Esper" src="/img/esper-logo-purple.svg" />
                </a>
              </SaveIndicator>
            </span>
          </div>

          <div className={"esper-collapse" + (this.state.open ? " open" : "")}
               id={this.getId(toggleId)}
               onClick={() => this.toggleCollapse()}>
            { loginInfo.match({
              none: () => null,
              some: () => <ul className="nav navbar-nav">
                <NavLink href={Paths.Time.charts({}).href}>
                  <i className="fa fa-fw fa-bar-chart"></i>{" "}Charts
                </NavLink>
                <NavLink href={Paths.Time.calendarLabeling({}).href}
                         hiddenXs={true}>
                  <i className="fa fa-fw fa-calendar"></i>{" "}Calendar
                </NavLink>
                <NavLink href={Paths.Time.list({}).href}>
                  <i className="fa fa-fw fa-th-list"></i>{" "}Event List
                </NavLink>
                <NavLink href={Paths.Manage.home().href}>
                  <i className="fa fa-fw fa-cog"></i>{" "}Settings
                </NavLink>
              </ul>
            })}

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
        <li key="0"><a href={Paths.Time.notificationSettings().href}>
          <i className="fa fa-fw fa-exchange"></i>{" "}
          Notification Settings
        </a></li>,
        <li key="1" className="divider" />,
        <li key="2"><a href={Paths.Landing.home().href} target="_blank">
          <i className="fa fa-fw fa-home"></i>{" "}
          Home
        </a></li>,
        <li key="3"><a href={Paths.Landing.contact().href} target="_blank">
          <i className="fa fa-fw fa-envelope"></i>{" "}
          Contact Us
        </a></li>,
        <li key="4"><a href={Paths.Landing.privacy().href} target="_blank">
          <i className="fa fa-fw fa-lock"></i>{" "}
          Privacy
        </a></li>,
        <li key="5"><a href={Paths.Landing.terms().href} target="_blank">
          <i className="fa fa-fw fa-legal"></i>{" "}
          Terms
        </a></li>,
        <li key="6" className="divider" />,
        <li key="7"><a onClick={() => Login.goToLogout()}>
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
        <a href={this.props.href}>
          {this.props.children}
        </a>
      </li>;
    }
  }

  class SaveIndicator extends React.Component<{
    children?: JSX.Element[];
  }, Save.Status> {
    _error: HTMLSpanElement;

    constructor(props: { children?: JSX.Element[] }) {
      super(props);
      this.state = { busy: false, error: false };
    }

    render() {
      if (this.state.busy) {
        return <span className="esper-spinner" />;
      }
      if (this.state.error) {
        return <span ref={(c) => this._error = c}
                     className="esper-save-error text-danger"
                     data-toggle="tooltip" data-placement="right"
                     title={Text.DefaultErrorTooltip}>
          <i className="fa fa-fw fa-warning" />
        </span>;
      }
      return <span>
        { this.props.children }
      </span>
    }

    componentDidMount() {
      Save.Emitter.addChangeListener(this.onChange);
      this.mountTooltip();
    }

    componentWillUnmount() {
      Save.Emitter.removeChangeListener(this.onChange);
    }

    componentDidUpdate() {
      this.mountTooltip();
    }

    mountTooltip() {
      if (this._error) {
        $(this._error).tooltip();
      }
    }

    // Arrow notation to create a single reference for change listener
    onChange = (status: Save.Status) => this.setState(status)
  }
}
