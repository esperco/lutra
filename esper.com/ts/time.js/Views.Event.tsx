/// <reference path="../common/Components.ModalPanel.tsx" />
/// <reference path="./Components.EventDetails.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />

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
      return <div className="container event-content">
        <div className="row"><div className="col-md-6 col-md-offset-3">
          { this.renderContent() };
        </div></div>
      </div>;
    }

    renderContent() {
      var eventKey = Events.keyForEvent(
        this.props.teamId, this.props.calId, this.props.eventId);
      var eventPair = Events.EventStore.get(eventKey);
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

      return <div className="panel panel-default">
        <div className="panel-heading title">{event.title}</div>
        <div className="panel-body">
          <Components.EventDetails event={event} />
          <EventNotes eventPair={eventPair} />
          <Components.LabelEditor2
            eventPairs={[eventPair]}
            teamPairs={Teams.allPairs()}
          />
        </div>
      </div>;
    }
  }

  class EventNotes extends Component<{
    eventPair: [Events.TeamEvent, Model.StoreMetadata]
  }, {
    saved: boolean;
    saveEnabled: boolean;
  }> {
    inputNotes: HTMLTextAreaElement;
    saveTimeout: number;

    constructor(props: { eventPair: [Events.TeamEvent, Model.StoreMetadata] }) {
      super(props);
      this.state = {
        saved: false,
        saveEnabled: false
      };
    }

    render() {
      var event = this.props.eventPair[0];
      var status = this.props.eventPair[1].dataStatus;
      var busy = status === Model.DataStatus.INFLIGHT;
      var error = status === Model.DataStatus.FETCH_ERROR ||
        status === Model.DataStatus.PUSH_ERROR;

      var okText = (() => {
        if (busy) return "Saving";
        if (this.state.saved) return "Saved";
        return "Save";
      })();
      var disableOk = busy || !this.state.saveEnabled;

      return <Components.ModalPanel busy={busy} error={error}
              okText={okText} onOK={() => this.submitNotes()}
              disableOK={disableOk}
              className="event-notes esper-panel-section">
        <label htmlFor={this.getId("notes")}>Post-Meeting Notes</label>
        <textarea id={this.getId("notes")} placeholder="Notes"
          ref={(ref) => this.inputNotes = ref}
          className="form-control" defaultValue={event.notes}
          onKeyDown={this.notesKeydown.bind(this)}
        />
      </Components.ModalPanel>;
    }

    notesKeydown(e: KeyboardEvent) {
      this.setState({saved: false, saveEnabled: true})
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => this.submitNotes(), 2000);
    }

    submitNotes() {
      var event = this.props.eventPair[0];
      var val = this.inputNotes.value.trim();
      if (event.notes !== val) {
        console.info(event.teamId);
        var p = Api.postEventNotes(event.teamId, event.id, val);
        var storeId = Events.storeId(event);
        var newEvent = _.cloneDeep(event);
        newEvent.notes = val;
        Events.EventStore.push(storeId, p, newEvent);
        this.setState({saved: true, saveEnabled: false});
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      clearTimeout(this.saveTimeout);
    }
  }
}
