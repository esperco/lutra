/*
  Basic component for rendering a list of events
*/

module Esper.Components {
  export module EventList_ {
    export interface Props {
      events: Types.TeamEvent[];
      selectedEvents?: Types.TeamEvent[];
      teams: ApiT.Team[];
      onEventToggle?: (event: Types.TeamEvent) => void;
      onEventClick?: (event: Types.TeamEvent) => void;
      onFeedbackClick?: (event: Types.TeamEvent) => void;
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
      return <div className={classNames('day clearfix', {
        today: Time.sameDay(m, moment()),
        future: Time.diffDay(m, moment()) > 0,
      })} key={timestamp}>
        <div className="day-title">
          <span className="month">
            { m.format("MMM") }
          </span>
          <span className="day-of-month">
            { m.format("D") }
          </span>
          <span className="day-of-week">
            { m.format("ddd") }
          </span>
        </div>
        <div className="day-events">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Stores.Events.TeamEvent) {
      var isActive = Stores.Events.isActive(event);
      var actionRequired = !!Stores.Events.needsConfirmation(event);
      return <div key={[event.teamId, event.calendarId, event.id].join(",")}
                  className={classNames("event", {
                    "has-labels": !!Stores.Events.getLabels(event).length,
                    "needs-confirmation": actionRequired,
                    "no-attend": !isActive,
                    "past": moment(event.end).diff(moment()) < 0
                  })}>
        <NoAttend event={event} />
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
        { isActive ?
          <div className="event-labels">
            <LabelList event={event} team={this.getTeam(event)} />
          </div> :
          null
        }
        {
          event.feedback && (event.feedback.notes ||
            (Stores.Events.isActive(event) && event.feedback.rating)) ?
          <div className="action-block event-feedback"
               onClick={() => this.handleFeedbackClick(event)}>
            <EventFeedback event={event} />
          </div> : null
        }
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
      <i className="fa fa-fw fa-eye-slash" />
    </Tooltip>;
  }

  function toggleAttend(e: React.MouseEvent, event: Stores.Events.TeamEvent) {
    e.stopPropagation();
    Actions.Feedback.post(event, {
      attended: !Stores.Events.isActive(event)
    });
  }

  function EventFeedback({event}: {event: Stores.Events.TeamEvent}) {
    /*
      Use text-overflow: ellipsis in CSS to truncate exactly at end of line but
      use JS to do a sanity-check too, and to keep DOM a little less cluttered.
    */
    var notes = (event.feedback.notes || "").slice(0, 250);

    // Format feedback
    return <span>
      <i className="fa fa-left fa-fw fa-comment-o" />
      <span className="star-rating">
        { Stores.Events.isActive(event) ?
          _.times(event.feedback.rating || 0, (i) =>
            <i key={i.toString()} className="fa fa-fw fa-star" />
          ) : null
        }
      </span>
      <span className="notes">
        { notes }
      </span>
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
