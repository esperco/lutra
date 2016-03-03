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
/// <reference path="./Views.LabelManage.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;


  //////

  interface LabelEditorProps {
    eventPairs: [Events.TeamEvent, Model.StoreMetadata][];
    teamPairs: [ApiT.Team, Model.StoreMetadata][];
    onDone?: () => void;
    showDescription?: boolean;
  }

  export function LabelEditor2(props: LabelEditorProps) {
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

    // NB: Use cancel button instead of OK button because purpose of button
    // is just to close panel, not do anything
    return <ModalPanel busy={busy} error={error} busyText={busyText}
                       onCancel={props.onDone} cancelText="Close">
      { props.showDescription && events.length === 1 ?
        <EventDetails event={events[0]} /> : null }
      <LabelInput events={events} />
      <LabelList events={events} teams={teams} />
      <div className="esper-select-menu">
        <div className="divider" />
        <a className="esper-selectable" target="_blank"
           onClick={renderManageLabels}>
        <i className="fa fa-fw fa-bars"></i>
        {" "}Manage Labels
        </a>
      </div>
    </ModalPanel>
  }

  function renderManageLabels() {
    Layout.renderModal(<Views.LabelManageModal />);
  }


  ///////

  function EventDetails({event}: {event: Events.TeamEvent}) {
    return <div className="event-details">
      <div className="time">
        <i className="fa fa-fw fa-clock-o" />{" "}
        <span className="start">
          { moment(event.start).format("ddd, MMM D, h:mm a") }
        </span>{" to "}<span className="end">
          { moment(event.end).format("h:mm a") }
        </span>{" "}
        { event.recurring_event_id ?
          <span className="recurring" title="Recurring">
            <i className="fa fa-fw fa-refresh" />
          </span> :
          null
        }
      </div>
      { event.location ?
        <div className="location">
          <i className="fa fa-fw fa-map-marker" />{" "}
          {event.location}
        </div>
        : null
      }
      { event.description ?
        <div className="description">
          {event.description}
        </div>
        : null
      }
    </div>;
  }


  ///////

  class LabelInput extends Component<{
    events: Events.TeamEvent[];
  }, {}> {
    _input: HTMLInputElement;

    render() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          New Labels (Separate by Commas)
        </label>
        <div className="input-group">
          <input type="text" className="form-control esper-modal-focus"
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
        var teamIds = _.map(this.props.events, (e) => e.teamId);
        teamIds = _.uniq(teamIds);
        _.each(teamIds, (teamId) => {
          Teams.addLabels(teamId, val);
        });
        EventLabelChange.add(this.props.events, val, true);
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
    var icon = (() => {
      if (checkedByAll) {
        return "fa-check-square";
      } else if (checkedBySome) {
        return "fa-minus-square-o"
      }
      return "fa-square-o";
    })();

    var handler = () => {
      if (checkedByAll) {
        EventLabelChange.remove(props.events, props.label.displayAs);
      } else {
        EventLabelChange.add(props.events, props.label.displayAs);
      }
    };

    return <a className="esper-selectable"
              key={props.label.id} onClick={handler}>
      <i className={"fa fa-fw " + icon} />{" "}
      {props.label.displayAs}
    </a>;
  }


  /////

  export class LabelEditorModal extends Component<LabelEditorProps, {}> {
    render() {
      var heading = (this.props.eventPairs.length === 1 ?
        this.props.eventPairs[0][0].title || "1 Event Selected":
        this.props.eventPairs.length + " Events Selected"
      );

      return <Modal icon="fa-calendar-o" title={heading}>
        <LabelEditor2 eventPairs={this.props.eventPairs}
                      teamPairs={this.props.teamPairs}
                      showDescription={this.props.showDescription}
                      onDone={() => Layout.closeModal()} />
      </Modal>;
    }
  }
}
