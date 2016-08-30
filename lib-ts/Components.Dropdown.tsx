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
/// <reference path="./Components.IfXS.tsx" />

module Esper.Components {
  const dropdownContainerId = "esper-dropdown";

  interface Props {
    children?: JSX.Element[];
    className?: string;
    disabled?: boolean;
    keepOpen?: boolean;
    onOpen?: () => void;
  }

  interface State {
    open: boolean;
  }

  export class Dropdown extends ReactHelpers.Component<Props, State> {
    // Attributes set after initial render of toggle
    _align: Align;
    _width: number;

    constructor(props: Props) {
      super(props);
      this.state = {
        open: false
      };
    }

    render() {
      // Get dropdown toggle handler
      var toggle = this.getToggle();
      if (! toggle) { return; }

      return <div className={classNames(this.props.className, {
                    dropdown: _.isUndefined(this.props.className)
                  })}
                  onClick={() => this.open()}>
        {toggle}
        { this.state.open ? this.getOverlay() : null }
      </div>;
    }

    open() {
      if (! this.props.disabled && !this.state.open) {
        this.setState({ open: true });
        if (this.props.onOpen) {
          this.props.onOpen();
        }
      }
    }

    close() {
      this.setState({ open: false });
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

      // Wrap with .dropdown class
      return <div className={classNames(this.props.className, {
        dropdown: _.isUndefined(this.props.className),
        open: true
      })} onClick={(e) => this.props.keepOpen && e.stopPropagation()}>
        { menu }
      </div>;
    }

    /* If dropdown open => update position of toggle to align menu */
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

      var offset = toggle.offset() || { left: 0, top: 0 };
      var height = toggle.outerHeight();
      this._width = toggle.outerWidth();

      var top = offset.top - $(window).scrollTop() + toggle.outerHeight();
      var bottom = $(window).height() - offset.top;
      var left = offset.left - $(window).scrollLeft();
      var right = $(window).width() - (offset.left + this._width);

      // Align right if if right edge is pretty far over
      var alignRight = (right / $(window).width()) <= 0.3;

      // Drop-up if top is too low
      var alignTop = (top / $(window).height()) > 0.7;

      this._align = alignTop ?

        // Dropup
        ( alignRight ?
          { bottom: bottom, right: right } :
          { bottom: bottom, left: left } ) :

        // Dropdown
        ( alignRight ?
          { top: top, right: right } :
          { top: top, left: left } );
    }

    getOverlay() {
      // Actual toggle should have been rendered in DOM -- we need this
      // to calculate menu position
      if (!this._align || !this._width) {
        Log.e("getMenu called without active toggle");
        return;
      }

      var menu = this.getMenu();
      if (! menu) { return; }

      return <Overlay id={dropdownContainerId}>
        <div className="dropdown-backdrop" onClick={() => this.close()}>
          {ifXS({

            // Mobile, no positioning
            xs: <DropdownWrapper>
              { menu }
            </DropdownWrapper>,

            // Desktop, align
            other: <DropdownWrapper align={this._align} width={this._width}>
              {menu}
            </DropdownWrapper>

          })}
        </div>
      </Overlay>;
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
    width?: number|string;
    align?: Align;
  }

  function hasTop(x: {top: number}|{bottom: number}): x is {top: number} {
    return x.hasOwnProperty('top');
  }

  // Desktop only -- mobile is simpler
  class DropdownWrapper extends ReactHelpers.Component<MenuProps, {}> {
    render() {
      var style = this.props.align ?

        // Desktop
        _.extend({
          minWidth: this.props.width,
          position: "absolute"
        }, this.props.align) :

        // Mobile
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        };

      return <div className="dropdown-wrapper" style={style}>
        { this.props.children }
      </div>;
    }

    // Apply maxHeight after rendering if actual height breaks window edge
    componentDidMount() {
      this.applyMax();
    }

    componentDidUpdate() {
      super.componentDidUpdate();
      this.applyMax();
    }

    applyMax() {
      let align = this.props.align;
      let maxHeight = align ?

        // Has align => desktop
        ( hasTop(align) ?

          // Dropdown
          $(window).height() - align.top :

          // Dropup
          $(window).height() - align.bottom ) :

        // No align => mobile
        $(window).height();

      // Buffer slightly
      maxHeight = maxHeight * 0.9;

      this.find('.dropdown-menu').css({
        "max-height": maxHeight,
        "overflow": "auto"
      });
    }
  }
}
