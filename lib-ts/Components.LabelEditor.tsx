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
    onSelect: (label: string, active: boolean) => void;
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

      // Refocus input if adding/removing events (used in calendar view)
      var newIds = _.map(this.props.events, (e) => e.id);
      var oldIds = _.map(prevProps.events, (e) => e.id);
      if (! _.isEqual(oldIds, newIds)) {
        this.focus();
      }
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
            count: 0
          }))
        );
      });

      // Zero out current label count (event count takes precedence)
      labels = labels.concat(_.map(current, (c) => ({
        id: c.id,
        displayAs: c.displayAs,
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

      return <div className="label-selector">
        <FilterInput
          ref={(c) => this._input = c}
          id={this.props.inputId}
          className="esper-section"
          placeholder={_.capitalize(Text.FindAddLabels)}
          getList={() => this._list}
          onSubmit={(label) => this.toggle(label)}
        />

        <div className="esper-section">
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
      let norm = Labels.getNorm(label);
      return <NewLabel
        key={norm}
        label={label}
        highlight={highlight}
        onClick={() => this.toggle(label)}
      />;
    }

    renderLabel(label: string, highlight: boolean) {
      let norm = Labels.getNorm(label);
      return <Label
        key={norm}
        displayAs={label}
        color={Colors.getColorForLabel(norm)}
        selected={this.isSelected(norm)}
        highlight={highlight}
        onClick={() => this.toggle(label)}
      />;
    }

    // New label
    toggle(label: string) {
      let norm = Labels.getNorm(label);
      let isSelected = this.isSelected(norm);
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

  function Label({displayAs, color, selected, highlight, onClick}: {
    displayAs: string;
    color: string;
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

    var iconStyle = { color: color };

    return <a className={className} onClick={onClick}>
      <i style={iconStyle} className={"fa fa-fw " + icon} />{" "}
      {displayAs}
    </a>;
  }

  function NewLabel({label, highlight, onClick}: {
    label: string;
    highlight?: boolean;
    onClick?: () => void;
  }) {
    let className = classNames("esper-selectable", {
      "highlight": highlight
    });
    return <a className={className} onClick={onClick}>
      <i className="fa fa-fw fa-plus" />{" "}{ label }
    </a>;
  }
}
