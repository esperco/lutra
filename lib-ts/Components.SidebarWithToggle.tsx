/*
  Component for toggling sidebar. Sidebar toggle and actual sidebar
  component themselves are separate. There should only be a single sidebar
  per side at any given moment.
*/

/// <reference path="./Option.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Overlay.tsx" />
/// <reference path="./Components.IfXS.tsx" />

module Esper.Components {
  const sidebarLeftId = "esper-sidebar-left";
  const sidebarRightId = "esper-sidebar-right";

  // Ref to active sidebars
  var _sidebarLeft = Option.none<Sidebar>();
  var _sidebarRight = Option.none<Sidebar>();


  // Toggle element - renders nothing if no _sidebar active.
  export class SidebarToggle extends ReactHelpers.Component<{
    className?: string;
    side: "left"|"right";
    children?: JSX.Element|JSX.Element[];
  }, {}> {
    render() {
      return <div className={classNames(
        "action esper-sidebar-toggle",
        this.props.className
      )} onClick={() => this.toggle()}>
        { this.props.children }
      </div>;
    }

    toggle() {
      // Default left
      let sidebar = this.props.side === "right" ?
        _sidebarRight : _sidebarLeft;
      sidebar.match({
        none: () => Log.e("Sidebar " + this.props.side +
                          " toggle without sidebar"),
        some: (s) => s.toggle()
      });
    }
  }


  // Actual sidebar itself
  interface SidebarProps {
    side: "left"|"right";
    className?: string;
    children?: JSX.Element|JSX.Element[];
  }

  export class Sidebar extends ReactHelpers.Component<SidebarProps, {
    open: boolean;
  }> {
    constructor(props: SidebarProps) {
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
      if (this.props.side === "right") {
        _sidebarRight = Option.some(this);
      } else {
        _sidebarLeft = Option.some(this);
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      Route.offBack(this.onBack);
      if (this.props.side === "right") {
        _sidebarRight = Option.none<Sidebar>();
      } else {
        _sidebarLeft = Option.none<Sidebar>();
      }
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
    different from the main sidebars
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
    let classes = classNames("esper-sidebar", className, {
      "esper-sidebar-left": left,
      "esper-sidebar-right": right,
      "open": open
    });

    // This div only wraps the inline bit (overlay is separate)
    return ifXS(
      // Mobile => overlay
      <Overlay id={left ? sidebarLeftId : sidebarRightId}>
        { open ?
          <div className="esper-sidebar-backdrop"
               onClick={toggleState} /> :
          null }
        <div className={classes} onClick={(e) => e.stopPropagation()}>
          { children }
        </div>
      </Overlay>,

      // Desktop => inline
      <div className={classes}>
        { children }
      </div>
    );
  }
}
