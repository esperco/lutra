/*
  Badge used in ListSelector
*/

/// <reference path="./Colors.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface BadgeProps {
    className?: string;
    text: string;
    hoverText?: string;
    color?: string;
  }

  export class Badge extends ReactHelpers.Component<BadgeProps, {
    hover: boolean;
  }> {
    constructor(props: BadgeProps) {
      super(props);
      this.state = { hover: false };
    }

    render() {
      var badgeStyle = (this.props.color) ? {
        background: this.props.color,
        color: Colors.colorForText(this.props.color)
      } : {};
      return <span className={"badge " + this.props.className}
              style={badgeStyle}
              onMouseEnter={this.onMouseEnter.bind(this)}
              onMouseLeave={this.onMouseLeave.bind(this)}>
        {
          this.state.hover ?
          (this.props.hoverText || this.props.text) :
          this.props.text
        }
      </span>;
    }

    onMouseEnter() {
      this.setState({ hover: true })
    }

    onMouseLeave() {
      this.setState({ hover: false })
    }
  }
}
