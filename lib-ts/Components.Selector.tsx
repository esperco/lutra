/*
  Simple select menu (this is only the display value, use Dropdown or
  DropdownModal for the actual menu itself).
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  export class Selector extends ReactHelpers.Component<{
    id?: string;
    className?: string;
    children?: JSX.Element[];
    disabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }, {}> {
    render() {
      var classes = this.props.className +
        " form-control esper-selector clearfix";
      return <div className={classes} onClick={this.props.onClick}
                  disabled={this.props.disabled}>

        {/* Tiny input box so label with 'for' property can trigger onClick */}
        <input type="text" id={this.props.id}
               style={{visibility: 'hidden', height: '1px', width: '1px'}} />

        <div className="esper-selector-content">
          <i className="fa fa-fw fa-caret-down pull-right" />
          {this.props.children}
        </div>
      </div>
    }
  }
}
