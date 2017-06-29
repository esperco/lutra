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
        <span className="caret"></span>
      </button>
      <ul className="dropdown-menu">
        <li><a>Action</a></li>
        <li><a>Another action</a></li>
        <li><a>Something else here</a></li>
        <li role="separator" className="divider"></li>
        <li><a>Separated link</a></li>
      </ul>
    </Components.Dropdown>

  First child should be the trigger element. Second child should be the
  dropdown menu. All other elements are ignored.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Overlay.tsx" />

module Esper.Components {
  const dropdownContainerId = "esper-dropdown";

  interface Props {
    children?: JSX.Element[];
    className?: string;
    disabled?: boolean;
    keepOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
  }

  interface State {
    open: boolean;
  }

  export class Dropdown extends ReactHelpers.Component<Props, State> {
    _toggle: HTMLElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        open: false
      };
    }

    render() {
      // Get dropdown toggle handler
      var toggle = this.getToggle();
      if (! toggle) { return null; }

      return <div className={classNames(this.props.className, {
                    dropdown: _.isUndefined(this.props.className)
                  })}
                  onClick={this.open.bind(this)}>
        {toggle}
        { this.state.open ? this.getOverlay() : null }
      </div>;
    }

    open(e: React.MouseEvent) {
      if (! this.props.disabled && !this.state.open) {
        this.setState({ open: true });
        if (this.props.onOpen) {
          this.props.onOpen();
        }
      }
    }

    close() {
      this.setState({ open: false });
      if (this.props.onClose) {
        this.props.onClose();
      }
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
        return null;
      }
      return menu;
    }

    /* If dropdown open => update reference of toggle to pass to overlay */
    componentWillUpdate(nextProps: Props, nextState: State) {
      if (nextState.open) {
        this.updateTogglePosition();
      }
    }

    // Set toggle position that can be used later for rendering menu
    updateTogglePosition() {
      var toggle = this.find('.dropdown-toggle');
      if (_.isEmpty(toggle)) {
        Log.e("Dropdown mounted without active toggle");
        return;
      }
      this._toggle = toggle.get(0);
    }

    getOverlay() {
      // Actual toggle should have been rendered in DOM -- we need this
      // to calculate menu position
      if (!this._toggle) {
        Log.e("getMenu called without active toggle");
        return;
      }

      var menu = this.getMenu();
      if (! menu) { return; }

      return <Overlay id={dropdownContainerId}>
        <div className="dropdown-backdrop" onClick={() => this.close()}>
          <DropdownWrapper anchor={this._toggle} keepOpen={this.props.keepOpen}>
            { menu }
          </DropdownWrapper>
        </div>
      </Overlay>;
    }
  }


  /*
    Above component is just the trigger -- this is the acutal menu that gets
    rendered
  */
  interface MenuProps {
    anchor: HTMLElement;
    keepOpen?: boolean;
    children?: JSX.Element[];
  }

  // Desktop only -- mobile is simpler
  class DropdownWrapper extends ReactHelpers.Component<MenuProps, {}> {
    render() {
      if (! this.props.anchor) {
        Log.e("DropdownWrapper called without anchor");
        return null;
      }
      let anchor = $(this.props.anchor);
      let offset = anchor.offset() || { left: 0, top: 0 };
      let style = {
        /*
          In addition to offset, we need to consider scroll position since
          offset is relative to document, not window, but dropdown is
          position: fixed (which is relative to window)

          Math.floor because it's possible for 1px rounding errors to cause
          our wrapper to extend just slightly past edge of window, which
          triggers ugly scroll bars.
        */
        left: Math.floor(offset.left - $(window).scrollLeft()),
        top: Math.floor(offset.top - $(window).scrollTop()),

        height: anchor.outerHeight(),
        width: anchor.outerWidth()
      };

      // Adjust horizontal alignment based on position
      let hAlign = (() => {
        let width = $(window).width();

        // Near left edge of screen
        if (style.left / width < 0.15) {
          return "left";
        }

        // Near right edge of screen
        if ((style.left + style.width) / width > 0.85) {
          return "right";
        }

        // In the middle
        return "center"
      })();

      // Drop-up if top is too low
      let vAlign = (style.top + style.height) / $(window).height() > 0.7 ?
        "up" : "down";

      let classes = classNames("dropdown-wrapper", "open", vAlign, hAlign);
      return <div className={classes} style={style}
                  onClick={(e) => this.props.keepOpen && e.stopPropagation()}>
        { this.props.children }
      </div>;
    }

    // Apply CSS corrections after rendering to prevent breaking window edge
    componentDidMount() {
      this.adjust();
    }

    componentDidUpdate() {
      super.componentDidUpdate();
      this.adjust();
    }

    adjust() {
      let menu = this.find('.dropdown-menu');
      if (_.isEmpty(menu)) { return; }

      /*
        Apply max-height -- calculated as the difference between the offset
        of the menu (calculated in the same manner the wrapper) and the window
        height.
      */
      let maxHeight = $(window).height() - menu.offset().top
                      + $(window).scrollTop();
      menu.css({
        "max-height": maxHeight * 0.9, // Buffer slightly
        "overflow": "auto"
      });

      // Too far left?
      let hPos = menu.offset().left - $(window).scrollLeft();
      if (hPos < 0) {
        this.find('.dropdown-wrapper')
          .removeClass("right")
          .removeClass("center")
          .addClass("left");
      }

      // Too far right?
      else if (hPos + menu.outerWidth() > $(window).width()) {
        this.find('.dropdown-wrapper')
          .removeClass("left")
          .removeClass("center")
          .addClass("right");
      }
    }
  }
}
