/*
  A component used for Bootstrap Tooltips
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Overlay.tsx" />
/// <reference path="./Util.ts" />

module Esper.Components {

  // Only one tooltip at any given time
  const overlayPrefix = "esper-tooltip-";

  interface Props {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
    title: string;
    children?: JSX.Element[];
  };

  interface State {
    active: boolean;
  }

  export class Tooltip extends ReactHelpers.Component<Props, State> {
    _elm: HTMLSpanElement;
    _id: string;

    constructor(props: Props) {
      super(props);
      this._id = overlayPrefix + Util.randomString();
      this.state = { active: false };
    }

    render() {
      return <span id={this.props.id}
        ref={(c) => this._elm = c}
        className={this.props.className}
        style={this.props.style}
        onMouseOver={() => this.setState({ active: true })}
        onMouseOut={() => this.setState({ active: false })}
        onClick={this.props.onClick}>
        { this.props.children }
        { this.state.active ? this.renderOverlay() : null }
      </span>;
    }

    renderOverlay() {
      if (! this._elm) {
        Log.e("Tooltip rendered anchor element");
        return null;
      }

      return <Overlay id={this._id}>
        <TooltipFloat title={this.props.title} anchor={this._elm} />
      </Overlay>;
    }
  }

  // Actual tooltip -- adjusts so not off screen
  class TooltipFloat extends ReactHelpers.Component<{
    title: string;

    // Inline Element
    anchor: HTMLElement;
  }, {}> {
    _tip: HTMLElement;

    render() {
      if (! this.props.anchor) {
        Log.e("TooltipFloat called without anchor");
        return null;
      }

      let elm = $(this.props.anchor);
      elm.offset();

      // Default -> render centered above anchor
      let offset = elm.offset() || { left: 0, top: 0 };
      let height = elm.outerHeight();
      let width = elm.outerWidth();
      let left = (offset.left - $(window).scrollLeft()) + (width / 2);
      let bottom = $(window).height() - (offset.top - $(window).scrollTop());
      let style = {
        left: left,
        bottom: bottom,
        transform: "translateX(-50%)"
      }

      return <div ref={(c) => this._tip = c}
                  className="esper-tooltip" style={style}>
        <div className="esper-tooltip-content">
          { this.props.title }
        </div>
      </div>;
    }

    componentDidMount() {
      this.adjustPosition();
    }

    componentDidUpdate() {
      super.componentDidUpdate();
      this.adjustPosition();
    }

    // Move tooltip if offscreen
    adjustPosition() {
      let elm = $(this._tip);
      if (_.isEmpty(elm)) return;

      let height = elm.outerHeight();
      let width = elm.outerWidth();

      let offset = elm.offset() || { left: 0, top: 0 };
      let left = offset.left - $(window).scrollLeft();
      let top = offset.top - $(window).scrollTop();

      // Manually use jQuery to nudge
      let newCSS: {
        left?: number|"auto";
        right?: number|"auto";
        top?: number|"auto";
        bottom?: number|"auto";
        transform?: string;
      } = {};

      // Too far left
      if (left < 0) {
        newCSS.left = 0;
        newCSS.transform = "";
      }

      // Too far right
      else if (left + width > $(window).width()) {
        newCSS.left = "auto";
        newCSS.right = 0;
        newCSS.transform = "";
      }

      // Too high
      if (top < 0) {
        newCSS.bottom = "auto"
        let anchor = $(this.props.anchor);
        newCSS.top = _.isEmpty(anchor) ? 0 :
          anchor.offset().top + anchor.outerHeight();
      }

      if (_.keys(newCSS).length > 0) {
        elm.css(newCSS);
      }
    }
  }
}
