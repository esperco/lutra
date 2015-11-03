/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Colors.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelSelectorProps {
    allLabels: [string, string][]; // Label + badge text
    selectedLabels: string[];
    updateFn: (selectedLabels: string[]) => void
  }

  export class LabelSelector extends Component<LabelSelectorProps, {}>
  {
    render() {
      if (!this.props.allLabels || !this.props.allLabels.length) {
        return <span></span>
      }

      return <div className="esper-borderless-section">
        <h4 className="esper-header">
          <i className="fa fa-fw fa-tags"></i>{" "}
          Select Labels
        </h4>
        <div className="esper-content list-group">
          {this.renderLabels()}
        </div>
      </div>;
    }

    renderLabels() {
      return _.map(this.props.allLabels, (pair) => {
        var label = pair[0];
        var badgeText = pair[1];
        var selected = _.contains(this.props.selectedLabels, label);
        var badgeStyle = selected ? {
          background: Colors.getColorForLabel(label)
        } : {};
        return <a href="#" onClick={this.handleClick.bind(this)}
            key={label} className="checkbox list-group-item one-line">
          <span className="badge" style={badgeStyle}>{badgeText}</span>
          <label>
            <input type="checkbox" value={label} checked={selected}
              onChange={this.handleChange.bind(this)} />
            {" "}{label}{" "}
          </label>
        </a>
      });
    }

    // Gets a list of labels based on what's checked
    getLabels(): string[] {
      return $.map(this.find("input:checked"), function(elm) {
        return $(elm).val();
      });
    }

    handleChange() {
      this.props.updateFn(this.getLabels());
    }

    // Handle click outside of input element (if clicking input, handleChange
    // should be triggered)
    handleClick(e: MouseEvent) {
      if ($(e.target).prop('nodeName').toLowerCase() !== "input") {
        var input = $(e.currentTarget).find('input');
        input.prop('checked', !input.prop('checked'));
        this.handleChange(); // Manually fire handleChange
      }
    }
  }
}