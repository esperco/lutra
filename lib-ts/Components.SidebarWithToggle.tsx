/*
  Component for toggling left sidebar. Sidebar toggle and actual sidebar
  component themselves are separate. There should only be a single sidebar
  at any given moment.
*/

/// <reference path="./Option.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  // Ref to active sidebar.
  var _toggle = Option.none<SidebarToggle>();
  var _sidebar = Option.none<Sidebar>();

  // Toggle element - renders nothing if no _sidebar active.
  export class SidebarToggle extends ReactHelpers.Component<{
    className?: string;
  }, {
    hasSidebar?: boolean;
  }> {
    constructor(props: {}) {
      super(props);
      this.state = { hasSidebar: _sidebar.isSome() };
    }

    render() {
      if (this.state.hasSidebar) {
        return <div className={classNames(
          "action esper-sidebar-toggle",
          this.props.className
        )} onClick={() => this.toggle()}>
          <i className="fa fa-fw fa-bars" />
        </div>;
      }
      return null;
    }

    componentDidMount() {
      _toggle = Option.some(this);
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      _toggle = Option.none<SidebarToggle>();
    }

    toggle() {
      _sidebar.match({
        none: () => null,
        some: (sidebar) => sidebar.toggle()
      });
    }
  }

  // Actual sidebar itself
  export class Sidebar extends ReactHelpers.Component<{
    className?: string;
    side?: "left"|"right";
    children?: JSX.Element|JSX.Element[];
  }, {
    open: boolean;
  }> {
    constructor(props: {}) {
      super(props);
      this.state = { open: false };
    }

    render() {
      return <SidebarBase
        className={this.props.className}
        side={this.props.side}
        open={this.state.open}
        toggleState={() => this.toggle()}
      >
        { this.props.children }
      </SidebarBase>;
    }

    toggle() {
      this.setState({open: !this.state.open});
    }

    componentDidMount() {
      Route.onBack(this.onBack);
      _sidebar = Option.some(this);
      _toggle.match({
        none: () => null,
        some: (toggle) => toggle.setState({
          hasSidebar: true
        })
      });
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      Route.offBack(this.onBack);
      _sidebar = Option.none<Sidebar>();
      _toggle.match({
        none: () => null,
        some: (toggle) => toggle.setState({
          hasSidebar: false
        })
      });
    }

    onBack = () => {
      if (this.state.open) {
        this.setState({open: false});
        return false;
      }
      return true;
    }
  }

  /*
    Base component if you want to create additional sidebar like objects
    different from the main sidebar
  */
  export function SidebarBase({className, open, side, children, toggleState}: {
    className?: string;
    open?: boolean;
    side?: "left"|"right";
    children?: JSX.Element|JSX.Element[];
    toggleState?: () => void;
  }) {
    let left = side !== "right";  // If blank, left
    let right = side === "right";
    return <div className={classNames("esper-sidebar", className, {
      "esper-sidebar-left": left,
      "esper-sidebar-right": right
    })}>
      { open ?
        <div className="esper-sidebar-backdrop"
             onClick={toggleState} /> :
        null }
      <div className={classNames("esper-sidebar-content", {
        open: open
      })} onClick={(e) => e.stopPropagation()}>
        { children }
      </div>
    </div>;
  }
}
