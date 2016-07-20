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
  dropdown menu. All other elements are ignored.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Modal.tsx" />

module Esper.Components {
  interface Props {
    children?: JSX.Element[];
    className?: string;
    align?: "left"|"right";
    dropup?: boolean;
    disabled?: boolean;
    keepOpen?: boolean;
    onOpen?: () => void;
  }

  export class Dropdown extends ReactHelpers.Component<Props, {}> {
    _menu: DropdownMenu;

    render() {
      // Just render
      var children = React.Children.toArray(this.props.children);

      // Get dropdown toggle handler
      var toggle = this.getToggle();
      if (! toggle) { return; }

      // Update existing menu if applicable
      if (this._menu) {

        /*
          requestAnimationFrame to avoid accessing DOM node from inside
          render function. Not ideal, but should be OK so long as we're
          we only update the dropdow menu itself and don't touch the toggle
        */
        window.requestAnimationFrame(
          () => renderDropdown(this.getMenuWrapper())
        );
      }

      return <div className={classNames(this.props.className, {
                    dropdown: _.isUndefined(this.props.className)
                  })}
                  onClick={() => this.open()}>
        {toggle}
      </div>;
    }

    open() {
      if (!this.props.disabled) {
        renderDropdown(this.getMenuWrapper())
        if (this.props.onOpen) {
          this.props.onOpen();
        }
      }
    }

    close() {
      clearDropdown();
    }

    /* Get specific toggle element from children */
    getToggle() {
      var children = React.Children.toArray(this.props.children);
      var toggle = _.find(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-toggle")
      );
      if (! toggle) {
        Log.e("No dropdown trigger found");
      }
      return toggle;
    }

    /* Get specific menu element from children */
    getMenu() {
      var children = React.Children.toArray(this.props.children);
      var menu = _.find(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-menu")
      );
      if (! menu) {
        Log.e("No dropdown menu found");
      }
      return menu;
    }

    getMenuWrapper() {
      // Actual toggle should have been rendered in DOM -- we need this
      // to calculate menu position
      var toggle = this.find('.dropdown-toggle');
      if (!(toggle && toggle.length)) {
        Log.e("getMenu called without active toggle");
        return;
      }

      var offset = toggle.offset() || { left: 0, top: 0 };
      var height = toggle.outerHeight();
      var width = toggle.outerWidth();
      var top = offset.top + toggle.outerHeight();
      var bottom = $(window).height() - offset.top;
      var left = offset.left;
      var right = $(window).width() - (offset.left + width);

      var align: Align = this.props.dropup ?

        // Dropup
        ( this.props.align === "right" ?
          { bottom: bottom, right: right } :
          { bottom: bottom, left: left } ) :

        // Dropdown
        ( this.props.align === "right" ?
          { top: top, right: right } :
          { top: top, left: left } );

      var menu = this.getMenu();
      if (! menu) { return; }

      return <DropdownMenu
        ref={(c) => this._menu = c}
        align={align}
        width={width}
        className={this.props.className}
        keepOpen={this.props.keepOpen}
      >
        { menu }
      </DropdownMenu>;
    }
  }


  /*
    Above component is just the trigger -- this is the acutal menu that gets
    rendered
  */
  type Align =
    { top: number; left: number; }|
    { top: number; right: number; }|
    { bottom: number; left: number; }|
    { bottom: number; right: number; }
  interface MenuProps {
    children?: JSX.Element[];
    className?: string;
    keepOpen?: boolean;
    width?: number|string;
    align: Align;
  }

  class DropdownMenu extends ReactHelpers.Component<MenuProps, {}> {
    constructor(props: MenuProps) {
      super(props);
    }

    render() {
      var style = _.extend({
        width: this.props.width,
        position: "absolute"
      }, this.props.align);
      return <div className="dropdown-backdrop" onClick={() => this.close()}>
        <div className={classNames(this.props.className, {
               dropdown: _.isUndefined(this.props.className),
               open: true
             })}
             style={style}
             onClick={(e) => this.props.keepOpen && e.stopPropagation()}>
          { this.props.children }
        </div>
      </div>;
    }

    /*
      No open() function -- use renderDropdown to just render a new menu.
      If menu already exists, React should be smart enough to re-use DOM
      elements and components.
    */
    close() {
      clearDropdown();
    }
  }


  /* Creates divs and whatnot for dropdowns */
  const dropdownContainerId = "esper-dropdown";
  function renderDropdown(content: JSX.Element) {
    var container = $("#" + dropdownContainerId);
    if (!container || !container.length) {
      container = $('<div>').attr("id", dropdownContainerId);
      $('body').append(container);
    }
    container.renderReact(content);
  }

  function clearDropdown() {
    var container = $("#" + dropdownContainerId);
    container.remove();
  }
}
