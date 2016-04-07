/*
  Component for editing event details, labels, etc.
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.StarRating.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface EventEditorProps {
    eventData: Model2.StoreData<Events2.FullEventId, Events2.TeamEvent>[];
    teamPairs: [ApiT.Team, Model.StoreMetadata][];

    minFeedback?: boolean;
    initAction?: boolean;
    onDone?: () => void;
    className?: string;
  }

  export function EventEditor(props: EventEditorProps) {
    if (! props.eventData.length) {
      return <div />;
    }

    return props.eventData[0].data.match({
      none: () => <div />,
      some: (firstEvent) => <div className={props.className}>
        { props.eventData.length === 1 ?
          <EventDetails event={firstEvent} /> :
          null
        }
        { props.eventData.length === 1 ?
          <EventFeedback event={firstEvent}
                         status={props.eventData[0].dataStatus}
                         initAction={props.initAction}
                         initMin={props.minFeedback} /> :
          null
        }
        <Components.LabelEditor2
          eventData={props.eventData}
          teamPairs={props.teamPairs}
          onDone={props.onDone}
          doneText="Done"
        />
      </div>
    });
  }

  ////

  export class EventEditorModal extends Component<EventEditorProps, {}> {
    render() {
      var heading = (this.props.eventData.length === 1 ?
        this.props.eventData[0].data.match({
          none: () => "",
          some: (e) => e.title
        }) || "1 Event Selected" :
        this.props.eventData.length + " Events Selected"
      );

      return <Modal icon="fa-calendar-o" title={heading}>
        <EventEditor eventData={this.props.eventData}
                     teamPairs={this.props.teamPairs}
                     onDone={() => Layout.closeModal()}
                     minFeedback={this.props.minFeedback} />
      </Modal>;
    }
  }

  ////

  export function EventDetails({event}: {event: Events2.TeamEvent}) {
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

  interface OneEventProps {
    event: Events2.TeamEvent;
    status: Model2.DataStatus;
    initAction?: boolean;
    initMin?: boolean;
  }

  export class EventFeedback extends Component<OneEventProps, {
    // Track last saved event so we only show success on save
    lastSavedEvent?: Events2.TeamEvent;

    // Current state of event notes (not yet committed, saved yet)
    notes?: string;

    minimize?: boolean;
  }> {
    inputNotes: HTMLTextAreaElement;
    inputSaveTimeout: number;

    constructor(props: OneEventProps) {
      super(props);
      this.state = {
        notes: this.props.event.feedback.notes,
        minimize: this.props.initMin
      };
    }

    render() {
      var event = this.props.event;
      var status = this.props.status;
      var busy = status === Model.DataStatus.INFLIGHT;
      var error = status === Model.DataStatus.FETCH_ERROR ||
                  status === Model.DataStatus.PUSH_ERROR;
      var hasChanges = this.state.notes !== event.feedback.notes;
      var disableOk = busy || !hasChanges;
      var success = !busy && !hasChanges && (
        (this.props.initAction && !this.state.lastSavedEvent) ||
        _.isEqual(this.state.lastSavedEvent, event)
      );

      if (this.state.minimize) {
        return <div onClick={() => this.setState({ minimize: false })}
          className="event-min-feedback esper-panel-section action clearfix">
          <a className="event-rating pull-left">
            { this.renderMinFeedback(event) }
          </a>
          <a className="pull-right min-feedback-action">
            <i className="fa fa-fw fa-caret-down" />
          </a>
        </div>;
      }

      return <Components.ModalPanel busy={busy} error={error} success={success}
          okText="Save" onOK={() => this.submitNotes()} disableOK={disableOk}
          className="event-notes esper-panel-section">
        <div>
          <label htmlFor={this.getId("notes")}>
            { Text.FeedbackTitle }
          </label>
          <a className="pull-right action min-feedback-action"
                onClick={() => this.setState({ minimize: true })}>
            <i className="fa fa-fw fa-caret-up" />
          </a>
        </div>
        <p className="text-muted">
          Don't worry! Ratings and notes are NOT shared with other
          meeting guests.
        </p>
        { this.renderRating(event) }
        <textarea id={this.getId("notes")} placeholder="Notes"
          ref={(ref) => this.inputNotes = ref}
          className="form-control" value={this.state.notes}
          onChange={(e) => this.notesChange(e)}
        />
      </Components.ModalPanel>;
    }

    renderMinFeedback(event: Events2.TeamEvent): JSX.Element|string {
     if (event.feedback.attended === false) {
       return Events2.isFuture(event) ?
         Text.NoAttendFuture : Text.NoAttendPast;
     }

     if (event.feedback.rating) {
      return <span>{
         _.times(event.feedback.rating || 0, (i) =>
          <i key={i.toString()} className="fa fa-fw fa-star" />
        )
       }</span>
     }

     return <span className="esper-link">
       { Text.FeedbackTitle }
     </span>;
    }

    renderRating(event: Events2.TeamEvent) {
      return <div className="row">
        <div className="col-sm-8 form-group event-star-ratings">
          <StarRating
            value={(event.feedback.attended && event.feedback.rating) || 0}
            onChange={(i) => this.submitStarRating(i)} />
        </div>
        <div className="col-sm-4 form-group">
          <button className={"form-control btn btn-default" +
                    (event.feedback.attended === false ? " active" : "")}
                  onClick={() => this.toggleAttended()}>
            <i className="fa fa-fw fa-ban" />{" "}
            { Events2.isFuture(event) ?
              Text.NoAttendFuture : Text.NoAttendPast }
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
      var event = this.props.event;
      if (event.feedback.notes !== this.state.notes) {
        var feedback = _.extend({}, event.feedback, {
          notes: this.state.notes
        }) as ApiT.EventFeedback;
        this.submitFeedback(feedback);
      }
    }

    toggleAttended() {
      var event = this.props.event;
      this.submitFeedback(_.extend({}, event.feedback, {
        attended: (event.feedback.attended === false ? true : false)
      }) as ApiT.EventFeedback);
    }

    submitStarRating(rating: number) {
      var event = this.props.event;
      this.submitFeedback(_.extend({}, event.feedback, {
        rating: rating,
        attended: true
      }) as ApiT.EventFeedback);
    }

    submitFeedback(feedback: ApiT.EventFeedback) {
      var event = _.cloneDeep(this.props.event);
      event.feedback = feedback;
      var p = Api.postEventFeedback(event.teamId, event.id, event.feedback);
      Events2.EventStore.push(Events2.storeId(event), p, Option.some(event));
      this.setState({lastSavedEvent: event});
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      clearTimeout(this.inputSaveTimeout);
    }
  }
}
