/*
  Component for editing event details, labels, etc.
*/

/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.TextArea.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface EventEditorProps {
    eventData: Model2.StoreData<Types.FullEventId, Types.TeamEvent>[];
    teams: ApiT.Team[];

    minFeedback?: boolean;
    initAction?: boolean;
    focusOnLabels?: boolean;
    onDone?: () => void;
    className?: string;
  }

  export function EventEditor(props: EventEditorProps) {
    if (! props.eventData.length) {
      return <div />;
    }

    let events = Option.flatten(_.map(props.eventData, (e) => e.data));
    let inputId = Util.randomString();
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
                         initMin={Stores.Events.isActive(firstEvent) &&
                                  props.minFeedback} /> :
          null
        }
        { props.eventData.length > 1 ||
          Stores.Events.isActive(firstEvent) ?
          <div className="esper-panel-section">
            { props.eventData.length === 1 ?
              <label htmlFor={inputId}>
                { Text.Labels }
              </label> : null }
            <LabelEditor
              inputId={inputId}
              events={events}
              teams={props.teams}
              onSelect={(label, active) => active ?
                Actions.EventLabels.add(events, label) :
                Actions.EventLabels.remove(events, label)
              }
              autoFocus={props.focusOnLabels}
            />
          </div> : null }
      </div>
    });
  }

  ////

  interface EventEditorModalProps extends EventEditorProps {
    onCancel?: () => void;
  }

  export class EventEditorModal
      extends Component<EventEditorModalProps, {}> {
    render() {
      var heading: JSX.Element|string = (this.props.eventData.length === 1 ?
        this.props.eventData[0].data.match({
          none: () => null,
          some: (e) => e.title ? <span className={classNames("title", {
            "no-attend": !Stores.Events.isActive(e)
          })}>
            {e.title}
          </span> : <span className="no-title">
            { Text.NoEventTitle }
          </span>
        }) || "1 Event Selected" :
        this.props.eventData.length + " Events Selected"
      );

      // Don't call onDone twice if identical to onCancel
      var onDone = this.props.onDone || Layout.closeModal;
      if (this.props.onCancel === onDone) {
        onDone = Layout.closeModal;
      }

      return <Modal icon="fa-calendar-o" title={heading}
                    onHidden={this.props.onCancel}>
        <EventEditor eventData={this.props.eventData}
                     teams={this.props.teams}
                     onDone={onDone}
                     focusOnLabels={this.props.focusOnLabels}
                     minFeedback={this.props.minFeedback} />
      </Modal>;
    }
  }

  ////

  export function EventDetails({event}: {event: Stores.Events.TeamEvent}) {
    var guestEmails = Stores.Events.getGuestEmails(event);

    return <div className="event-details esper-panel-section">
      <div className="time">
        <i className="fa fa-fw fa-clock-o" />{" "}
        <span className="start">
          { moment(event.start).format("ddd, MMM D, h:mm a") }
        </span>{" to "}<span className="end">
          { moment(event.end).format("h:mm a") }
        </span>{" "}
        { event.recurringEventId ?
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
      {
        (guestEmails && guestEmails.length) ?
        <div className="guests">
          <i className="fa fa-fw fa-users" />{" "}
          { guestEmails.join(", ") }
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
    event: Stores.Events.TeamEvent;
    status: Model2.DataStatus;
    initAction?: boolean;
    initMin?: boolean;
  }

  export class EventFeedback extends Component<OneEventProps, {
    // Track last saved event so we only show success on save
    lastSavedEvent?: Stores.Events.TeamEvent;

    // Current state of event notes (not yet committed, saved yet)
    notes?: string;

    minimize?: boolean;
  }> {
    inputNotes: TextArea;
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
      var busy = status === Model2.DataStatus.INFLIGHT;
      var error = status === Model2.DataStatus.FETCH_ERROR ||
                  status === Model2.DataStatus.PUSH_ERROR;
      var hasChanges = this.state.notes !== event.feedback.notes;
      var disableOk = busy || !hasChanges;
      var success = !busy && !hasChanges && (
        (this.props.initAction && !this.state.lastSavedEvent) ||
        _.isEqual(this.state.lastSavedEvent, event)
      );

      if (this.state.minimize) {
        return <div onClick={() => this.setState({ minimize: false })}
          className="event-min-feedback esper-panel-section action clearfix">
          <a className="event-rating action pull-left">
            { this.renderMinFeedback(event) }{" "}
            <i className="fa fa-fw fa-caret-down" />
          </a>
          <a className={classNames("pull-right no-attend-action action", {
            active: !Stores.Events.isActive(event)
          })} onClick={() => this.toggleAttended()}>
            <i className="fa fa-fw fa-ban" />
          </a>
        </div>;
      }

      return <ModalPanel busy={busy} error={error} success={success}
          okText="Save" onOK={() => this.submitNotes()} disableOK={disableOk}
          className="event-notes esper-panel-section">
        <div className="action"
             onClick={() => this.setState({ minimize: true })}>
          <label htmlFor={this.getId("notes")}>
            { Text.FeedbackTitle }
          </label>
          <a className="pull-right action min-feedback-action">
            <i className="fa fa-fw fa-caret-up" />
          </a>
        </div>
        <p className="text-muted">
          Don't worry! Ratings and notes are NOT shared with other
          meeting guests.
        </p>
        <div className="esper-section">
          { this.renderRating(event) }
        </div>
        <div className="esper-full-width">
          <TextArea id={this.getId("notes")} placeholder="Notes"
            ref={(ref) => this.inputNotes = ref}
            className="form-control esper-modal-focus"
            initValue={this.state.notes}
            onChange={(v) => this.notesChange(v)}
          />
        </div>
      </ModalPanel>;
    }

    renderMinFeedback(event: Stores.Events.TeamEvent): JSX.Element|string {
     if (! Stores.Events.isActive(event)) {
       return Text.NoAttend;
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

    renderRating(event: Stores.Events.TeamEvent) {
      return <div className="row">
        <div className="col-sm-8 pad-xs event-star-ratings">
          <StarRating
            value={(Stores.Events.isActive(event)
                    && event.feedback.rating) || 0}
            onChange={(i) => this.submitStarRating(i)} />
        </div>
        <div className="col-sm-4 pad-xs event-no-attend">
          <button className={"form-control btn btn-default" +
                    (Stores.Events.isActive(event) ? "" : " active")}
                  onClick={() => this.toggleAttended()}>
            <i className="fa fa-fw fa-ban" />{" "}
            { Stores.Events.isActive(event) ?
              Text.YesAttend : Text.NoAttend }
          </button>
        </div>
      </div>;
    }

    notesChange(value: string) {
      clearTimeout(this.inputSaveTimeout);
      this.inputSaveTimeout = setTimeout(() => this.submitNotes(), 2000);
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
        attended: !Stores.Events.isActive(event)
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
      var newEvent = Actions.Feedback.post(this.props.event, feedback);
      this.setState({lastSavedEvent: newEvent});
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      clearTimeout(this.inputSaveTimeout);
    }
  }
}
