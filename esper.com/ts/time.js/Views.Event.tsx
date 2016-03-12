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

  function submitFeedback(event: Events.TeamEvent) {
    var p = Api.postEventFeedback(event.teamId, event.id, event.feedback);
    Events.EventStore.push(Events.storeId(event), p, event);
  }

  export class EventView extends Component<Property, {}> {
    inputRating: HTMLSelectElement;

    renderWithData() {
      return <div className="container event-content">
        <div className="row"><div className="col-md-6 col-md-offset-3">
          { this.renderContent() };
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
        <div className="panel-body">
          <Components.EventDetails event={event} />
          <EventNotes eventPair={eventPair} />
          <div className="esper-selectable"
               onClick={() => this.toggleAttended()}>
            <i className={"fa fa-fw " + (
              event.feedback.attended === false ?
              "fa-square-o" : "fa-check-square-o"
            )} />{" "}
            Attended
          </div>
          <select value={rating}
                  ref={(ref) => this.inputRating = ref}
                  onChange={() => this.updateRating()}>
            <option value=""></option>
            <option value="1">Hated It</option>
            <option value="2">Disliked It</option>
            <option value="3">Okay</option>
            <option value="4">Liked It</option>
            <option value="5">Loved It</option>
          </select>
          <Components.LabelEditor2
            eventPairs={[eventPair]}
            teamPairs={Teams.allPairs()}
          />
        </div>
      </div>;
    }

    toggleAttended() {
      var event = _.cloneDeep(Events.EventStore.val(this.eventKey()));
      event.feedback.attended = ! event.feedback.attended;
      submitFeedback(event);
    }

    updateRating() {
      var event = _.cloneDeep(Events.EventStore.val(this.eventKey()));
      event.feedback.rating = parseInt(this.inputRating.value);
      submitFeedback(event);
    }

    eventKey() {
      return Events.keyForEvent(
        this.props.teamId, this.props.calId, this.props.eventId);
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
          className="form-control" defaultValue={event.feedback.notes}
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
      if (event.feedback.notes !== val) {
        console.info(event.teamId);
        var newEvent = _.cloneDeep(event);
        newEvent.feedback.notes = val;
        submitFeedback(newEvent);
        this.setState({saved: true, saveEnabled: false});
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      clearTimeout(this.saveTimeout);
    }
  }
}
