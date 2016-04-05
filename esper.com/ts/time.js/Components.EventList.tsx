/*
  Basic component for rendering a list of events
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    events: Events2.TeamEvent[];
    selectedEvents?: Events2.TeamEvent[];
    onEventToggle?: (event: Events2.TeamEvent) => void;
    onEventClick?: (event: Events2.TeamEvent) => void;
    onLabelClick?: (event: Events2.TeamEvent, labelNorm: string) => void;
  }

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

    renderDay(timestamp: number, events: Events2.TeamEvent[]) {
      var m = moment(timestamp);
      return <div className="day" key={timestamp}>
        <div className="day-title">{ m.format("MMM D - dddd") }</div>
        <div className="list-group">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Events2.TeamEvent) {
      return <div key={[event.teamId, event.calendar_id, event.id].join(",")}
                  className="list-group-item event">
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
          <div className={"title" +
                 (this.props.onEventClick ? " esper-link" : "") +
                 (event.feedback.attended === false ? " no-attend" : "")}
               onClick={() => this.props.onEventClick &&
                              this.props.onEventClick(event)}>
            {event.title}
          </div>
          <div className="time">
            <span className="start">
              { moment(event.start).format("h:mm a") }
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
          <div className="event-rating">
            { _.times((event.feedback.attended !== false &&
                       event.feedback.rating) || 0, (i) =>
              <i key={i.toString()} className="fa fa-fw fa-star" />
            )}
          </div>
          <div className="event-labels">
            { _.map(event.labels_norm,
              (l, i) => this.renderLabel(event, l, event.labels[i])
            ) }
          </div>
        </div>
      </div>;
    }

    renderLabel(event: Events2.TeamEvent, id: string, displayAs: string) {
      var labelColor = Colors.getColorForLabel(id)
      var style = {
        background: labelColor,
        color: Colors.colorForText(labelColor)
      };

      var onClick = () => {
        if (this.props.onLabelClick) {
          this.props.onLabelClick(event, id)
        }
      }

      var clearLabel = ((e: __React.MouseEvent) => {
        e.stopPropagation();
        EventLabelChange.remove([event], displayAs);
      });

      return <span style={style} key={id} className="event-label"
        onClick={onClick}
      >
        <i className="fa fa-fw fa-tag" />{" "}
        {displayAs}
        <span className="hidden-xs esper-clear-action"
              onClick={(e) => clearLabel(e)}>{" "}
          <i className="fa fa-fw fa-times" />
        </span>
      </span>;
    }

    ////////

    isSelected(event: Events2.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Events2.TeamEvent) {
      return _.findIndex(this.props.selectedEvents || [], (e) =>
        Events2.matchRecurring(e, event)
      );
    }
  }


  /////

  export class EventListModal extends ReactHelpers.Component<Props, {}> {
    render() {
      var heading = Text.events(this.props.events.length);
      return <Modal icon="fa-calendar-o" title={heading}>
        { React.createElement(EventList, this.getProps()) }
      </Modal>;
    }

    // Extend provided props with defaults for modal
    getProps(): Props {
      var newProps = _.clone(this.props);
      newProps.onLabelClick = newProps.onLabelClick ||
        function(event: Events2.TeamEvent, label_norm: string) {
          Route.nav.path("/list", {
            jsonQuery: {
              labels: {
                all: false,
                none: false,
                some: [label_norm],
                unmatched: false
              }
            }
          })
        };

      newProps.onEventClick = newProps.onEventClick ||
        function(event: Events2.TeamEvent) {
          Layout.renderModal(Containers.eventEditorModal([event]));
        };
      return newProps;
    }
  }
}
