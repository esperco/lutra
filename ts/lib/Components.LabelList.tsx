/*
  Component for showing a list of labels for some events
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Labels.ts" />
/// <reference path="./Text.tsx" />
/// <reference path="./Types.ts" />

module Esper.Components {
  interface Props {
    event: Types.TeamEvent;
    team: ApiT.Team;
  }

  interface State {}

  export class LabelList extends ReactHelpers.Component<Props, State> {
    _dropdown: Components.Dropdown;

    render() {
      var labels = _.sortBy(
        Option.matchList(this.props.event.labels),
        (l) => l.displayAs
      );
      return <div className="label-list">
        <div className="event-labels">
          <i className="fa fa-left fa-fw fa-tags" />
          { _.map(labels, (l) =>
            <Label key={l.id} label={l}
              onRemove={() => Actions.EventLabels.remove(
                [this.props.event], l
              )}
            />)
          }

          <Components.Dropdown ref={(c) => this._dropdown = c}
            className="action dropdown"
            keepOpen={true}
          >
            <span className="dropdown-toggle">
              <i className="fa fa-fw fa-plus" />
              { labels.length ? "" : " " + Text.AddLabel }
            </span>
            <div className="dropdown-menu esper-section">
              { this.renderEditor() }
            </div>
          </Components.Dropdown>
        </div>
      </div>;
    }

    renderEditor() {
      return <LabelEditor
        autoFocus={true}
        events={[this.props.event]}
        teams={[this.props.team]}
        onEsc={() => this._dropdown && this._dropdown.close()}
        onSelect={
          (label, active, method) => this.editEventLabel(label, active, method)
        }
      />;
    }

    editEventLabel(
      label: Types.Label,
      active: boolean,
      method: "click"|"type"
    ) {
      if (active) {
        Actions.EventLabels.add([this.props.event], label);
        Actions.Teams.addLabel(this.props.team.teamid, label);
      } else {
        Actions.EventLabels.remove([this.props.event], label)
      }

      // Auto-close dropdown if click
      if (method === "click" && this._dropdown) {
        this._dropdown.close();
      }
    }

    rmEventLabel(label: Types.Label) {
      Actions.EventLabels.remove([this.props.event], label)
    }
  }

  /*
    Single label object -- supports a "partial" mode for use
  */
  function Label({label, onRemove}: {
    label: Types.Label;
    onRemove?: () => void;
  }) {
    var style = {
      borderStyle: "solid",
      borderColor: label.color,
      background: label.color,
      color: Colors.colorForText(label.color)
    };

    return <span style={style} className="event-label">
      { label.displayAs }{" "}
      { onRemove ?
        <span className="action rm-action hidden-xs"
              onClick={onRemove}>
          <i className="fa fa-fw fa-close" />
        </span> : null }
    </span>;
  }
}
