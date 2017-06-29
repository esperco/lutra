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
  }

  export class EventView extends Component<Property, {}> {
    renderWithData() {
      var eventData = Stores.Events.EventStore.get({
        teamId: this.props.teamId,
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
        return <div className="esper-spinner" />;
      }

      var error = eventData.dataStatus === Model2.DataStatus.FETCH_ERROR;
      if (error || eventData.data.isNone()) {
        return <Components.ErrorMsg />;
      }

      var team = Stores.Teams.require(this.props.teamId);

      return eventData.data.match({
        none: () => {
          Log.e("No event data found");
          return <Components.ErrorMsg />;
        },
        some: (event) => <div>
          <Components.EventHeader
            title={event.title ? <span className={classNames("title", {
              "no-attend": !Stores.Events.isActive(event)
            })}>
              {event.title}
            </span> : <span className="no-title">
              {Text.NoEventTitle}
            </span>}
            onBack={() => Actions.goToPrev(event)}
            onNext={() => Actions.goToNext(event)}
          />
          <div className="panel panel-default">
            <div className="panel-body">
              <Components.EventEditor
                className="esper-section"
                eventData={[eventData]}
                teams={team ? [team] : []}
              />
            </div>
          </div>
        </div>
      });
    }

    updateTeam(teamId: string) {
      Actions.getEventFromOtherTeam(teamId, this.props.eventId).then((e) => {
          e.match({
            some: (event) => Actions.goToEvent(event),
            none: () =>
              Stores.Events.EventStore.get({
                teamId: this.props.teamId,
                eventId: this.props.eventId
              }).flatMap((d) => d.data).match({
                // Go to start of event
                some: (event) => Actions.goToDate(event.start, { teamId }),
                // Go
                none: () => Actions.goToDate(new Date(), { teamId })
              })
          });
      });
    }
  }
}
