/*
  Component for updating labels for a given task
*/

/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Components.ModalPanel.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./EventLabelChange.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.EventEditor.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  //////

  interface LabelEditorProps {
    eventPairs: [Events.TeamEvent, Model.StoreMetadata][];
    teamPairs: [ApiT.Team, Model.StoreMetadata][];
    onDone?: () => void;
    doneText?: string;
  }

  export class LabelEditor2 extends Component<LabelEditorProps, {
    // Did labels change in between props? Set in componentWillReceiveProps
    labelsChanged?: boolean;
  }> {
    constructor(props: LabelEditorProps) {
      super(props);
      this.state = {};
    }

    componentWillReceiveProps(newProps: LabelEditorProps) {
      // Events changed => not a label change
      var oldIds = _.map(this.props.eventPairs, (p) =>
        [p[0].calendar_id, p[0].teamId, p[0].id]
      );
      var newIds = _.map(newProps.eventPairs, (p) =>
        [p[0].calendar_id, p[0].teamId, p[0].id]
      );
      if (! _.isEqual(oldIds, newIds)) {
        this.setState({ labelsChanged: false });
        return;
      }

      // Check if labels changed
      var oldLabels = _.map(this.props.eventPairs, (p) =>
        p[0].labels_norm
      );
      var newLabels = _.map(newProps.eventPairs, (p) =>
        p[0].labels_norm
      );
      if (!_.isEqual(oldLabels, newLabels)) {
        this.setState({ labelsChanged: true });
      }
    }

    render() {
      var props = this.props;
      var events = _.map(props.eventPairs, (e) => e[0]);
      var teams = _.map(props.teamPairs, (t) => t[0]);
      var metadata = _.map(props.eventPairs, (e) => e[1])
        .concat(_.map(props.teamPairs, (t) => t[1]));

      var error = !!_.find(metadata, (m) =>
        m.dataStatus === Model.DataStatus.PUSH_ERROR ||
        m.dataStatus === Model.DataStatus.FETCH_ERROR
      );

      var busy = !!_.find(metadata, (m) =>
        m.dataStatus === Model.DataStatus.INFLIGHT
      );
      var busyText = <span className="esper-footer-text">Saving &hellip;</span>;

      var success = !busy && this.state.labelsChanged;
      var selectedTeamId = events[0] ? events[0].teamId : "";

      // NB: Use cancel button instead of OK button because purpose of button
      // is just to close panel, not do anything
      return <ModalPanel busy={busy} error={error} busyText={busyText}
              onCancel={props.onDone} cancelText={props.doneText || "Close"}
              success={success} className="esper-panel-section">
        <div className="esper-panel-section">
          <LabelInputForEvents events={events} />
          <LabelList events={events} teams={teams} />
          <div className="esper-select-menu">
            <div className="divider" />
            <a className="esper-selectable" target="_blank"
               href={"#!/labels/" + selectedTeamId}>
            <i className="fa fa-fw fa-bars"></i>
            {" "}Manage Labels
            </a>
          </div>
        </div>
      </ModalPanel>
    }
  }


  ///////

  function LabelInputForEvents({events}: {
    events: Events.TeamEvent[];
  }) {
    return <LabelInput onSubmit={(val) => {
      var teamIds = _.map(events, (e) => e.teamId);
      teamIds = _.uniq(teamIds);
      _.each(teamIds, (teamId) => {
        Teams.addLabels(teamId, val);
      });
      EventLabelChange.add(this.props.events, val, true);
    }} />;
  }

  export class LabelInput extends Component<{
    onSubmit: (val: string) => void;
  }, {}> {
    _input: HTMLInputElement;

    render() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          Find / Add Labels{" "}
          <span className="comma-note esper-note">Separate by Commas</span>
        </label>
        <div className="input-group">
          <input type="text" className="form-control"
                 id={this.getId("new-labels")} ref={(c) => this._input = c}
                 onKeyDown={this.inputKeydown.bind(this)}
                 placeholder={
                  "Q1 Sales Goal, Positive Meeting, Negative Meeting"
                 } />
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    onClick={this.submitInput.bind(this)}>
              <i className="fa fa-fw fa-plus" />{" "}Add
            </button>
          </span>
        </div>
      </div>;
    }

    submitInput() {
      var input = $(this._input);
      var val = input.val().trim();
      if (val) {
        this.props.onSubmit(val);
      }
      input.val("");
      input.focus();
    }

    // Catch enter key on input -- use jQuery to actual examine value
    inputKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitInput();
      }
    }
  }


  ///////

  function LabelList(props: {
    events: Events.TeamEvent[];
    teams: ApiT.Team[]
  }) {
    if (! props.events.length) {
      return <span />;
    }

    var labels = Labels.fromEvents(props.events, props.teams);
    labels = Labels.sortLabels(labels);
    return <div className="esper-select-menu">
      {
        _.map(labels,
          (l) => <Label key={l.id} label={l} events={props.events} />
        )
      }
    </div>;
  }

  function Label(props: {
    label: Labels.LabelCount;
    events: Events.TeamEvent[]
  }) {
    var checkedByAll = props.label.count === props.events.length;
    var checkedBySome = props.label.count > 0;

    var labelClass = (() => {
      var ret = "esper-selectable";
      if (checkedByAll) {
        return ret + " active";
      } else if (checkedBySome) {
        return ret + " partial-active";
      }
      return ret;
    })();
    var icon = (() => {
      if (checkedByAll) {
        return "fa-check-square";
      } else if (checkedBySome) {
        return "fa-minus-square";
      }
      return "fa-square";
    })();
    var iconStyle = { color: Colors.getColorForLabel(props.label.id) };

    var handler = () => {
      if (checkedByAll) {
        EventLabelChange.remove(props.events, props.label.displayAs);
      } else {
        EventLabelChange.add(props.events, props.label.displayAs);
      }
    };

    return <a key={props.label.id} className={labelClass} onClick={handler}>
      <i style={iconStyle} className={"fa fa-fw " + icon} />{" "}
      {props.label.displayAs}
    </a>;
  }
}
