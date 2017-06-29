/*
  Basic component for rendering a list of events

  TODO: Modify to take Types.EventsForRange[] data / calc.
*/

module Esper.Components {
  export module EventList_ {
    export interface Props {
      events: Types.TeamEvent[];
      isSelected?: (event: Types.TeamEvent) => boolean;
      teams: ApiT.Team[];
      onEventToggle?: (event: Types.TeamEvent) => void;
      onEventClick?: (event: Types.TeamEvent) => void;
      showLabels?: boolean; // => default true
      showAttendToggle?: boolean; // => default true
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
      var showLabels = this.props.showLabels !== false;
      var showAttendToggle = this.props.showAttendToggle !== false;

      return <div key={[event.teamId, event.id].join(",")}
                  className={classNames("event", {
                    "has-labels": !!Stores.Events.getLabels(event).length,
                    "needs-confirmation": actionRequired,
                    "no-attend": !isActive,
                    "past": moment(event.end).diff(moment()) < 0
                  })}>
        { showAttendToggle ? <NoAttend event={event} /> : null }
        {
          this.props.onEventToggle ?
          <div className="event-checkbox"
               onClick={() => this.props.onEventToggle(event)}>
            { this.props.isSelected && this.props.isSelected(event) ?
              <i className="fa fa-fw fa-check-square-o" /> :
              <i className="fa fa-fw fa-square-o" />
            }
          </div> : null
        }
        <div className={"title" +
               (this.props.onEventClick ? " esper-link" : "") +
               (Stores.Events.isActive(event) ? "": " no-attend")}
             onClick={(e) => this.onEventClick(e, event)}>
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
              <i className="fa fa-fw fa-clone" />
            </span> :
            null
          }
        </div>
        { isActive && showLabels ?
          <div className="event-labels">
            <LabelList event={event} team={this.getTeam(event)} />
          </div> :
          null
        }
      </div>;
    }

    onEventClick(e: __React.MouseEvent, event: Types.TeamEvent) {
      if (this.props.onEventToggle && e.shiftKey) {
        this.props.onEventToggle(event);
        return;
      }
      this.props.onEventClick && this.props.onEventClick(event);
    }

    getTeam(event: Stores.Events.TeamEvent) {
      return _.find(this.props.teams, (t) => t.teamid === event.teamId);
    }
  }

  function NoAttend({event}: {event: Stores.Events.TeamEvent}) {
    // Declined -> indicate to user
    if (Stores.Events.declined(event)) {
      return <Tooltip className="declined" title={Text.DeclinedTooltip}>
        { Text.Declined }
      </Tooltip>;
    }

    // Used in tooltip
    var isActive = Stores.Events.isActive(event);
    var title = isActive ? Text.HideLong : Text.UnhideLong;

    return <Tooltip className={classNames("action", "no-attend-action", {
                                active: !isActive
                              })} title={title}
        onClick={(e) => toggleAttend(e, event)}>
      { isActive ? Text.Hide : Text.Unhide }
    </Tooltip>;
  }

  function toggleAttend(e: React.MouseEvent, event: Stores.Events.TeamEvent) {
    e.stopPropagation();
    Actions.EventLabels.hide([event], !event.hidden);
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
