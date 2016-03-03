/*
  Component for toggling left sidebar
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  export class SidebarToggle extends ReactHelpers.Component<{}, {
    open: boolean;
  }> {
    constructor(props: {}) {
      super(props);
      this.state = { open: false };
    }

    render() {
      return <div className="visible-xs-block sidebar-toggle"
                  onClick={() => this.toggle()}>
        { this.state.open ?
          <i className="fa fa-fw fa-angle-double-down" /> :
          <i className="fa fa-fw fa-angle-double-up" />
        }
      </div>;
    }

    toggle() {
      var elm = this.jQuery().closest(".esper-left-sidebar");
      elm.toggleClass("open");

      if (elm.hasClass("open")) {
        this.setState({open: true});
      } else {
        this.setState({open: false});
      }
    }
  }
}
