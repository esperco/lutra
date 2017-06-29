/*
  Drop in (more or less) replacement for <select> element using Dropdown
  and Selector components
*/

/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Components.Selector.tsx" />

module Esper.Components {
  interface Props {
    options: {
      val: string;
      display: JSX.Element|string;
    }[];
    onChange: (s: string) => void;

    id?: string;
    placeholder?: string;
    selected?: string;
  }

  export class SelectMenu extends ReactHelpers.Component<Props ,{}> {
    render() {
      var displayText: JSX.Element|string = this.props.placeholder || "";
      if (this.props.selected) {
        var selectedOpt = _.find(this.props.options,
          (o) => o.val === this.props.selected
        );
        if (selectedOpt) {
          displayText = selectedOpt.display;
        }
      }
      return <Components.Dropdown>
        <Components.Selector id={this.props.id} className="dropdown-toggle">
          { displayText }
        </Components.Selector>
        <ul className="dropdown-menu">
          { _.map(this.props.options, (o) => <li key={o.val}>
            <a onClick={() => this.props.onChange(o.val)}>{ o.display }</a>
          </li>)}
        </ul>
      </Components.Dropdown>
    }
  }
}
