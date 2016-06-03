/*
  View for post-meeting feedback
*/

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Property {
    calId: string;
    eventId: string;
    teamId: string;
    initAction?: boolean;
  }

  export class EventView extends Component<Property, {}> {
    renderWithData() {
      var eventData = Stores.Events.EventStore.get({
        teamId: this.props.teamId,
        calId: this.props.calId,
        eventId: this.props.eventId
      });
      return <div className="container event-content">
        <div className="row"><div className="col-md-6 col-md-offset-3">
          {
            eventData.match({
              none: () => {
                Log.e("Event key missing");
                return <Components.ErrorMsg />;
              },
              some: (data) => this.renderContent(data)
            })
          }
        </div></div>
      </div>;
    }

    renderContent(eventData: Stores.Events.EventData) {
      var busy = eventData.dataStatus === Model2.DataStatus.FETCHING
      if (busy) {
        return <div className="esper-spinner esper-centered esper-medium" />;
      }

      var error = eventData.dataStatus === Model2.DataStatus.FETCH_ERROR;
      if (error || eventData.data.isNone()) {
        return <Components.ErrorMsg />;
      }

      var event = eventData.data.unwrap();
      return eventData.data.match({
        none: () => {
          Log.e("No event data found");
          return <Components.ErrorMsg />;
        },
        some: (event) => <div className="panel panel-default">
          <div className="panel-heading title">{event.title ||
            <span className="no-title">{Text.NoEventTitle}</span>
          }</div>
            <Components.EventEditor
              className="panel-body"
              eventData={[eventData]}
              teams={Stores.Teams.all()}
              initAction={this.props.initAction}
              onDone={() => Route.nav.path("/list")}
            />
        </div>
      });
    }
  }
}
