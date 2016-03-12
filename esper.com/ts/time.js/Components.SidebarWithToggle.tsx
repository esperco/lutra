/*
  Component for toggling left sidebar
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  export class SidebarWithToggle extends ReactHelpers.Component<{
    children?: JSX.Element|JSX.Element[];
  }, {
    open: boolean;
  }> {
    constructor(props: {}) {
      super(props);
      this.state = { open: false };
    }

    render() {
      return <div className={"esper-left-sidebar padded" +
                             ( this.state.open ? " open" : "")}>
        { this.state.open ?
          <div className="esper-collapse-backdrop" onClick={() => this.toggle()} /> :
          null }
        <div className="sidebar-content">
          <div className="visible-xs-block sidebar-toggle"
                  onClick={() => this.toggle()}>
            { this.state.open ?
              <i className="fa fa-fw fa-angle-double-down" /> :
              <i className="fa fa-fw fa-angle-double-up" />
            }
          </div>
          <div className={"esper-collapse" + (this.state.open ? " open" : "")}>
            { this.props.children }
          </div>
        </div>
      </div>;
    }

    toggle() {
      this.setState({open: !this.state.open});
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
        this.jQuery().closest(".esper-left-sidebar").removeClass("open");
        return false;
      }
      return true;
    }
  }
}
