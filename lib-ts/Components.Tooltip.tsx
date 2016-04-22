/*
  A component used for Bootstrap Tooltips
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  export class Tooltip extends ReactHelpers.Component<{
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
    title: string;
    children?: JSX.Element[];
  }, {}> {
    _elm: HTMLSpanElement;

    render() {
      return <span id={this.props.id}
          ref={(c) => this._elm = c}
          className={this.props.className}
          style={this.props.style}
          title={this.props.title}
          onClick={this.props.onClick}
          data-original-title={this.props.title}
          data-toggle="tooltip">
        { this.props.children }
      </span>;
    }

    componentDidMount() {
      this.mountTooltip();
    }

    componentDidUpdate() {
      this.mountTooltip();
    }

    mountTooltip() {
      $(this._elm).tooltip();
    }
  }
}
