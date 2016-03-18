/// <reference path="../common/Components.ModalPanel.tsx" />
/// <reference path="./Components.EventEditor.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />

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
      return <div className="container event-content">
        <div className="row"><div className="col-md-6 col-md-offset-3">
          { this.renderContent() }
        </div></div>
      </div>;
    }

    renderContent() {
      var eventPair = Events.EventStore.get(this.eventKey());
      var event = eventPair[0];
      var metadata = eventPair[1];

      var busy = Option.cast(metadata).match({
        none: () => false,
        some: (m) => m.dataStatus === Model.DataStatus.FETCHING
      });
      if (busy) {
        return <div className="esper-spinner esper-centered esper-medium" />;
      }

      var error = Option.cast(metadata).match({
        none: () => true,
        some: (m) => m.dataStatus === Model.DataStatus.FETCH_ERROR
      });
      if (error) {
        return <Components.ErrorMsg />;
      }

      var rating = event.feedback.rating === undefined ? ""
                 : event.feedback.rating.toString();

      return <div className="panel panel-default">
        <div className="panel-heading title">{event.title}</div>
          <Components.EventEditor
            className="panel-body"
            eventPairs={[eventPair]}
            teamPairs={Teams.allPairs()}
            initAction={this.props.initAction}
            onDone={() => Route.nav.path("/list")}
          />
      </div>;
    }

    eventKey() {
      return Events.keyForEvent(
        this.props.teamId, this.props.calId, this.props.eventId);
    }
  }
}
