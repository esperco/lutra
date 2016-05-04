/*
  A Bootstrap-style Dropdown that uses React rather than native DOM events.
  Makes it easier to do things like not close the Dropdown when clicking
  outside of it. This component is incompatible with Bootstrap's dropdown JS,
  so make sure it isn't included in vendor file.

  Usage:

    <Components.Dropdown keepOpen={true}>
      <button className="btn btn-default dropdown-toggle" type="button"
              id="dropdownMenu1">
        Dropdown
        <span class="caret"></span>
      </button>
      <ul className="dropdown-menu">
        <li><a>Action</a></li>
        <li><a>Another action</a></li>
        <li><a>Something else here</a></li>
        <li role="separator" class="divider"></li>
        <li><a>Separated link</a></li>
      </ul>
    </Components.Dropdown>

  First child should be the trigger element. Second child should be the
  dropdown menu or modal. The "dropdown-menu" class will be replaced with the
  "dropdown-modal-menu" class. All other elements are disregarded.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Modal.tsx" />

module Esper.Components {
  export class Dropdown extends ReactHelpers.Component<{
    children?: JSX.Element[];
    className?: string;
    keepOpen?: boolean;
  }, {
    open?: boolean;
  }> {
    render() {
      var children = React.Children.toArray(this.props.children);

      // Attach dropdown toggle handler
      var toggleIndex = _.findIndex(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-toggle")
      );
      Log.assert(toggleIndex >= 0, "No dropdown trigger found");
      var originalToggle = children[toggleIndex] as React.ReactElement<any>;
      children[toggleIndex] = React.cloneElement(originalToggle, {
        onClick: this.toggle.bind(this)
      });

      // Attach handler to manage propagation when clicking inside menu
      var menuIndex = _.findIndex(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-menu")
      );
      Log.assert(menuIndex >= 0, "No dropdown menu found");
      var originalMenu = children[menuIndex] as React.ReactElement<any>;
      children[menuIndex] = React.cloneElement(originalMenu, {
        onClick: (e: React.MouseEvent) => (
          this.props.keepOpen ? e.stopPropagation() : this.close()
        )
      });

      // Is dropdown open?
      var isOpen = this.state && this.state.open;

      return <div className={
          (this.props.className || "dropdown") + (isOpen ? " open" : "")
      }>
        { children.slice(0, toggleIndex + 1) }
        { isOpen ?
          <div className="dropdown-backdrop" key="backdrop"
               onClick={this.toggle.bind(this)} /> :
          null
        }
        { children.slice(toggleIndex + 1) }
      </div>;
    }

    toggle() {
      if (this.state && this.state.open) {
        this.setState({open: false});
      } else {
        this.setState({open: true});
      }
    }

    close() {
      this.setState({open: false});
    }
  }
}
