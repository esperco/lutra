/*
  Component for editing event details, labels, etc.
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.StarRating.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface EventEditorProps {
    eventPairs: [Events.TeamEvent, Model.StoreMetadata][];
    teamPairs: [ApiT.Team, Model.StoreMetadata][];
    onDone?: () => void;
    className?: string;
  }

  export function EventEditor(props: EventEditorProps) {
    if (! props.eventPairs.length) {
      return <div />;
    }

    var eventPair = props.eventPairs[0];
    var event = eventPair[0];

    return <div className={props.className}>
      { props.eventPairs.length === 1 ?
        <EventDetails event={event} /> :
        null
      }
      { props.eventPairs.length === 1 ?
        <EventFeedback eventPair={eventPair} /> :
        null
      }
      <Components.LabelEditor2
        eventPairs={props.eventPairs}
        teamPairs={props.teamPairs}
        onDone={props.onDone}
        doneText="Done"
      />
    </div>;
  }

  ////

  export class EventEditorModal extends Component<EventEditorProps, {}> {
    render() {
      var heading = (this.props.eventPairs.length === 1 ?
        this.props.eventPairs[0][0].title || "1 Event Selected":
        this.props.eventPairs.length + " Events Selected"
      );

      return <Modal icon="fa-calendar-o" title={heading}>
        <EventEditor eventPairs={this.props.eventPairs}
                      teamPairs={this.props.teamPairs}
                      onDone={() => Layout.closeModal()} />
      </Modal>;
    }
  }

  ////

  export function EventDetails({event}: {event: Events.TeamEvent}) {
    return <div className="event-details esper-panel-section">
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

  ////

  interface EventPairProps {
    eventPair: [Events.TeamEvent, Model.StoreMetadata];
  }

  export class EventFeedback extends Component<EventPairProps, {
    // Track last saved event so we only show success on save
    lastSavedEvent?: Events.TeamEvent;

    // Current state of event notes (not yet committed, saved yet)
    notes?: string;
  }> {
    inputNotes: HTMLTextAreaElement;
    inputSaveTimeout: number;

    constructor(props: EventPairProps) {
      super(props);
      this.state = { notes: this.props.eventPair[0].feedback.notes };
    }

    render() {
      var event = this.props.eventPair[0];
      var status = this.props.eventPair[1].dataStatus;
      var busy = status === Model.DataStatus.INFLIGHT;
      var error = status === Model.DataStatus.FETCH_ERROR ||
                  status === Model.DataStatus.PUSH_ERROR;
      var hasChanges = this.state.notes !== event.feedback.notes;
      var disableOk = busy || !hasChanges;
      var success = !busy && !hasChanges &&
        _.isEqual(this.state.lastSavedEvent, event);

      return <Components.ModalPanel busy={busy} error={error} success={success}
          okText="Save" onOK={() => this.submitNotes()} disableOK={disableOk}
          className="event-notes esper-panel-section">
        <label htmlFor={this.getId("notes")}>Post-Meeting Feedback</label>
        { this.renderRating(event) }
        <textarea id={this.getId("notes")} placeholder="Notes"
          ref={(ref) => this.inputNotes = ref}
          className="form-control" value={this.state.notes}
          onChange={(e) => this.notesChange(e)}
        />
      </Components.ModalPanel>;
    }

    renderRating(event: Events.TeamEvent) {
      return <div className="row">
        <div className="col-sm-8 form-group event-star-ratings">
          <StarRating
            value={(event.feedback.attended && event.feedback.rating) || 0}
            onChange={(i) => this.submitStarRating(i)} />
        </div>
        <div className="col-sm-4 form-group">
          <button className={"form-control btn btn-default" +
                    (event.feedback.attended ? "" : " active")}
                  onClick={() => this.toggleAttended()}>
            <i className="fa fa-fw fa-ban" />{" "}
            Didn't Attend
          </button>
        </div>
      </div>;
    }

    notesChange(e: React.FormEvent) {
      clearTimeout(this.inputSaveTimeout);
      this.inputSaveTimeout = setTimeout(() => this.submitNotes(), 2000);

      var value = (e.target as HTMLTextAreaElement).value;
      this.setState({notes: value});
    }

    submitNotes() {
      var event = this.props.eventPair[0];
      if (event.feedback.notes !== this.state.notes) {
        var feedback = _.extend({}, event.feedback, {
          notes: this.state.notes
        }) as ApiT.EventFeedback;
        this.submitFeedback(feedback);
      }
    }

    toggleAttended() {
      var event = this.props.eventPair[0];
      this.submitFeedback(_.extend({}, event.feedback, {
        attended: !event.feedback.attended
      }) as ApiT.EventFeedback);
    }

    submitStarRating(rating: number) {
      var event = this.props.eventPair[0];
      this.submitFeedback(_.extend({}, event.feedback, {
        rating: rating,
        attended: true
      }) as ApiT.EventFeedback);
    }

    submitFeedback(feedback: ApiT.EventFeedback) {
      var event = _.cloneDeep(this.props.eventPair[0]);
      event.feedback = feedback;
      var p = Api.postEventFeedback(event.teamId, event.id, event.feedback);
      Events.EventStore.push(Events.storeId(event), p, event);
      this.setState({lastSavedEvent: event});
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      clearTimeout(this.inputSaveTimeout);
    }
  }
}
