module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class EventView extends Component<{eventKey:string}, {}> {
    renderWithData() {
      var eventPair = Events.EventStore.get(this.props.eventKey);
      var event = eventPair[0];
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
        <Components.LabelEditor2
          eventPairs={[eventPair]}
          teamPairs={Teams.allPairs()}
        />
      </div>;
    }
  }
}
