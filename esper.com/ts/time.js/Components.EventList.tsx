/*
  Basic component for rendering a list of events
*/

module Esper.Components {
  const LABEL_COUNT_CUTOFF = 4;
  const PREDICTED_LABEL_PERCENT_CUTOFF = 0.2;

  export module EventList_ {
    export interface Props {
      events: Stores.Events.TeamEvent[];
      selectedEvents?: Stores.Events.TeamEvent[];
      teams: ApiT.Team[];
      onEventToggle?: (event: Stores.Events.TeamEvent) => void;
      onEventClick?: (event: Stores.Events.TeamEvent) => void;
      onFeedbackClick?: (event: Stores.Events.TeamEvent) => void;
      onAddLabelClick?: (event: Stores.Events.TeamEvent) => void;
    }
  }

  type Props = EventList_.Props;

  export class EventList extends ReactHelpers.Component<Props, {}> {
    constructor(props: Props) {
      super(props);
    }

    render() {
      var events = this.props.events;
      if (events.length === 0) {
        return <div className="esper-no-content">
          No events found
        </div>;
      }

      var groupByDays = _.groupBy(events,
        (e) => moment(e.start).clone().startOf('day').valueOf()
      );
      var sortedKeys = _.sortBy(_.keys(groupByDays), (k) => parseInt(k));

      return <div className="event-list">
        {
          _.map(sortedKeys, (k) =>
            this.renderDay(parseInt(k), groupByDays[k])
          )
        }
      </div>;
    }

    renderDay(timestamp: number, events: Stores.Events.TeamEvent[]) {
      var m = moment(timestamp);
      return <div className={classNames('day', {
        today: Time.sameDay(m, moment()),
        future: Time.diffDay(m, moment()) > 0,
      })} key={timestamp}>
        <div className="day-title">{ m.format("MMM D - dddd") }</div>
        <div className="list-group">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Stores.Events.TeamEvent) {
      var isActive = Stores.Events.isActive(event);
      var actionRequired = !!Stores.Events.needsConfirmation(event);
      return <div key={[event.teamId, event.calendarId, event.id].join(",")}
                  className={classNames("list-group-item event", {
                    "has-labels": !!Stores.Events.getLabels(event).length,
                    "needs-confirmation": actionRequired,
                    "no-attend": !isActive,
                    "past": moment(event.end).diff(moment()) < 0
                  })}>
        {
          this.props.onEventToggle ?
          <div className="event-checkbox"
               onClick={() => this.props.onEventToggle(event)}>
            { this.isSelected(event) ?
              <i className="fa fa-fw fa-check-square-o" /> :
              <i className="fa fa-fw fa-square-o" />
            }
          </div> : null
        }
        <div className="event-content">
          <NoAttend event={event} />
          <div className={"title" +
                 (this.props.onEventClick ? " esper-link" : "") +
                 (Stores.Events.isActive(event) ? "": " no-attend")}
               onClick={() => this.props.onEventClick &&
                              this.props.onEventClick(event)}>
            { event.title ||
              <span className="no-title">{Text.NoEventTitle}</span> }
          </div>
          <div className="time">
            <span className="start">
              { moment(event.start).format("h:mm a") }
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
          <div className="action event-feedback"
               onClick={() => this.handleFeedbackClick(event)}>
            <EventFeedback event={event} />
          </div>
          { isActive ?
            <div className="event-labels">
              <LabelList event={event}
                         team={this.getTeam(event)}
                         onAddLabelClick={this.props.onAddLabelClick} />
            </div> :
            null
          }
        </div>
      </div>;
    }

    getTeam(event: Stores.Events.TeamEvent) {
      return _.find(this.props.teams, (t) => t.teamid === event.teamId);
    }

    handleFeedbackClick(event: Stores.Events.TeamEvent) {
      if (this.props.onFeedbackClick) {
        this.props.onFeedbackClick(event);
      }
    }

    ////////

    isSelected(event: Stores.Events.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Stores.Events.TeamEvent) {
      return _.findIndex(this.props.selectedEvents || [], (e) =>
        Stores.Events.matchRecurring(e, event)
      );
    }
  }

  function NoAttend({event}: {event: Stores.Events.TeamEvent}) {
    // Check if no feedback
    var feedback = event.feedback || {}

    // Used in tooltip
    var isActive = Stores.Events.isActive(event);
    var title = isActive ? Text.YesAttend : Text.NoAttend;

    return <Tooltip className={classNames("action", "no-attend-action", {
                                active: !isActive
                              })} title={title}
        onClick={(e) => toggleAttend(e, event)}>
      <i className="fa fa-fw fa-close" />
    </Tooltip>;
  }

  function toggleAttend(e: React.MouseEvent, event: Stores.Events.TeamEvent) {
    e.stopPropagation();
    var newFeedback = _.clone(event.feedback);
    newFeedback.attended = !Stores.Events.isActive(event);
    Actions.Feedback.post(event, newFeedback);
  }

  function EventFeedback({event}: {event: Stores.Events.TeamEvent}) {
    // Check if no feedback
    var feedback = event.feedback || {}

    // Format feedback
    return <span>
      { Stores.Events.isActive(event) ?
        _.times(feedback.rating || 0, (i) =>
          <i key={i.toString()} className="fa fa-fw fa-star" />
        ) : null
      }
      {" "}
      { feedback.notes ? <i className="fa fa-fw fa-comment" /> : null }
    </span>;
  }


  /////

  export class EventListModal extends ReactHelpers.Component<Props, {}> {
    render() {
      var heading = Text.events(this.props.events.length);
      return <Modal icon="fa-calendar-o" title={heading}>
        { React.createElement(EventList, this.props) }
      </Modal>;
    }
  }
}
