module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Property {
    event: ApiT.GenericCalendarEvent;
  }

  export class EventView extends Component<Property, {}> {
    renderWithData() {
      var event = this.props.event;
      return <div className="event-content">
        <div className="title">{event.title}</div>
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
        <div className="event-labels">
          { _.map(event.labels_norm,
            (l, i) => this.renderLabel(l, event.labels[i])
          ) }
        </div>
      </div>;
    }

    renderLabel(id: string, displayAs: string) {
      var labelColor = Colors.getColorForLabel(id)
      var style = {
        background: labelColor,
        color: Colors.colorForText(labelColor)
      };
      return <span style={style} key={id} className="event-label">
        <i className="fa fa-fw fa-tag" />{" "}
        {displayAs}
      </span>;
    }
  }
}
