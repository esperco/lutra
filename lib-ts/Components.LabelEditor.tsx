/*
  Component for updating labels for a given event
*/

/// <reference path="./Components.FilterInput.tsx" />
/// <reference path="./Labels.ts" />
/// <reference path="./Types.ts" />
/// <reference path="./Util.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface Props {
    inputId?: string;
    events: Types.TeamEvent[];
    teams: ApiT.Team[];
    onSelect: (label: Types.LabelBase, active: boolean) => void;
    onEsc?: () => void;
    autoFocus?: boolean;
  }

  interface State {
    /*
      Labels are a function of events and teams in props, but we remember
      label list statefully because toggling a label should not cause a
      label to disappear from the list right away (i.e. give user a chance
      to re-add removed label).
    */
    labels: Types.LabelCount[];
  }

  export class LabelEditor extends Component<Props, State> {
    _input: FilterInput;
    _list: FilterList;

    constructor(props: Props) {
      super(props);
      let labelCounts = this.getLabelCounts(props);
      this.state = {
        labels: labelCounts
      };
    }

    componentWillReceiveProps(newProps: Props) {
      let labelCounts = this.getLabelCounts(newProps, this.state.labels);
      this.setState({
        labels: labelCounts
      });
    }

    componentDidMount() {
      this.focus();
    }

    componentDidUpdate(prevProps: Props) {
      super.componentDidUpdate();
      this.focus();
    }

    // Add any labels from props to existing label list
    getLabelCounts(props: Props, current: Types.LabelCount[] = []) {
      let labels = Labels.fromEvents(props.events);

      // Add team labels
      _.each(props.teams, (team) => {
        let teamLabels = Labels.fromTeam(team)
        labels = labels.concat(
          _.map(teamLabels, (t) => ({
            id: t.id,
            displayAs: t.displayAs,
            color: t.color,
            count: 0
          }))
        );
      });

      // Zero out current label count (event count takes precedence)
      labels = labels.concat(_.map(current, (c) => ({
        id: c.id,
        displayAs: c.displayAs,
        color: c.color,
        count: 0
      })));

      /*
        Unique works left to right, so labels with counts should take
        priority over labels with no counts
      */
      return _.uniqBy(labels, (l) => l.id);
    }

    focus() {
      if (this.props.autoFocus) {
        this._input && this._input.focus();
      }
    }

    render() {
      let choices = _.map(this.state.labels, (l) => l.displayAs);
      choices.sort();

      return <div className="label-selector esper-section">
        <div className="esper-section">
          <FilterInput
            ref={(c) => this._input = c}
            id={this.props.inputId}
            placeholder={_.capitalize(Text.FindAddLabels)}
            getList={() => this._list}
            onEsc={this.props.onEsc}
            onSubmit={this.toggle.bind(this)}
          />
        </div>

        <div className="esper-section esper-full-width">
          <FilterList
            ref={(c) => this._list = c}
            className="esper-select-menu"
            choices={choices}
            itemFn={
              (label, highlight) => this.renderLabel(label, highlight)
            }
            newItemFn={
              (label, highlight) => this.renderNewLabel(label, highlight)
            }
          />
        </div>
      </div>
    }

    renderNewLabel(label: string, highlight: boolean) {
      let newLabel = {
        id: Labels.getNorm(label),
        displayAs: label,
        color: Colors.getNewColorForLabel()
      };
      return <NewLabel
        key={newLabel.id}
        label={newLabel}
        highlight={highlight}
        onClick={() => this.toggle(newLabel.displayAs, newLabel)}
      />;
    }

    renderLabel(label: string, highlight: boolean) {
      let labelCount = _.find(this.state.labels, {displayAs: label});
      return <Label
        key={labelCount.id}
        label={labelCount}
        selected={this.isSelected(labelCount.id)}
        highlight={highlight}
        onClick={() => this.toggle(labelCount.displayAs, labelCount)}
      />;
    }

    // New label
    toggle(labelStr: string, label?: Types.LabelBase) {
      if (!label) {
        label = {
          id: Labels.getNorm(labelStr),
          displayAs: labelStr,
          color: Colors.getNewColorForLabel()
        };
      }
      console.info(label);
      let isSelected = this.isSelected(label.id);
      this.props.onSelect(label, isSelected === "some" || !isSelected);
      this._input.reset();
    }

    /*
      NB: This is O(n^2), which shouldn't be an issue if there aren't that
      many labels. But if label count goes up, make label count a hash.
    */
    isSelected(labelNorm: string): Types.Fuzzy {
      var labelCount = _.find(this.state.labels, (l) => l.id === labelNorm);
      if (labelCount && labelCount.count) {
        if (labelCount.count === this.props.events.length) {
          return true;
        } else {
          return "some";
        }
      }
      return false;
    }
  }


  ///////

  function Label({label, selected, highlight, onClick}: {
    label: Types.LabelBase;
    selected: Types.Fuzzy;
    highlight?: boolean;
    onClick?: () => void;
  }) {
    let className = classNames("esper-selectable", {
      "active": selected === true,
      "partial-active": selected === "some",
      "highlight": highlight
    });

    let icon = Util.match<Types.Fuzzy, string>(selected, [
      [true, "fa-check-square"],
      ["some", "fa-minus-square"]
    ], "fa-square")

    var iconStyle = { color: label.color };

    return <a className={className} onClick={onClick}>
      <i style={iconStyle} className={"fa fa-fw " + icon} />{" "}
      {label.displayAs}
    </a>;
  }

  function NewLabel({label, highlight, onClick}: {
    label: Types.LabelBase;
    highlight?: boolean;
    onClick?: () => void;
  }) {
    let className = classNames("esper-selectable", {
      "highlight": highlight
    });
    return <a className={className} onClick={onClick}>
      <i className="fa fa-fw fa-plus" />{" "}{ label.displayAs }
    </a>;
  }
}
