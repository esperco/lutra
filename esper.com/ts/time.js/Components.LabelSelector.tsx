/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Login.OAuth.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.Section.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelSelectorProps {
    allLabels: {
      displayAs?: string;
      labelNorm: string;
      badge?: string;
    }[]; // Label + badge text
    selectedLabels: string[];
    updateFn: (selectedLabels: string[]) => void;
    minimized?: boolean;
    toggleMinimized?: () => void;
  }

  export class LabelSelector extends Component<LabelSelectorProps, {}>
  {
    render() {
      if (!this.props.allLabels || !this.props.allLabels.length) {
        return <span></span>
      }

      return <BorderlessSection icon="fa-tags" title="Select Labels"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
        {this.renderLabels()}
      </BorderlessSection>;
    }

    renderLabels() {
      return _.map(this.props.allLabels, (labelOpts) => {
        var displayAs = labelOpts.displayAs || labelOpts.labelNorm;
        var labelNorm = labelOpts.labelNorm;
        var badgeText = labelOpts.badge;
        var selected = _.contains(this.props.selectedLabels, labelNorm);
        var badgeStyle = selected ? {
          background: Colors.getColorForLabel(labelNorm)
        } : {};
        var clickHandler = () => {
          this.handleClick(labelNorm, !selected);
        };
        return <a onClick={clickHandler}
            key={labelNorm} className="list-group-item one-line">
          <span className="badge" style={badgeStyle}>{badgeText}</span>
          <i className={"fa fa-fw " +
            (selected ? "fa-check-square-o" : "fa-square-o")} />
          {" "}{displayAs}
        </a>
      });
    }

    // Handle click outside of input element (if clicking input, handleChange
    // should be triggered)
    handleClick(label: string, newChecked: boolean) {
      var allLabels = _.clone(this.props.selectedLabels);
      var alreadyChecked = _.contains(allLabels, label);
      if (newChecked && !alreadyChecked) {
        allLabels.push(label);
      } else if (!newChecked && alreadyChecked) {
        allLabels = _.without(allLabels, label);
      }
      this.props.updateFn(allLabels);
    }
  }
}
