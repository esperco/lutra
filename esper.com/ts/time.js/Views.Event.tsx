module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Property {
    eventKey: string;
    eventid: string;
    teamid: string;
  }

  export class EventView extends Component<Property, {}> {
    inputNotes: HTMLInputElement;

    renderWithData() {
      var eventPair = Events.EventStore.get(this.props.eventKey);
      var event = eventPair[0];
      return <div className="event-content">
        <div className="title">{event.title}</div>
        <div>
          <input type="text" placeholder="Notes" className="form-control"
            defaultValue={event.notes} ref={(ref) => this.inputNotes = ref}
            onKeyDown={this.notesKeydown.bind(this)}
          />
        </div>
        <Components.LabelEditor2
          showDescription={true}
          eventPairs={[eventPair]}
          teamPairs={Teams.allPairs()}
        />
      </div>;
    }

    notesKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();

        Api.postEventNotes(this.props.teamid, this.props.eventid,
                           this.inputNotes.value);

        var event = Events.EventStore.val(this.props.eventKey);
        event.notes = this.inputNotes.value;
        Events.EventStore.set(this.props.eventKey, event);
      }
    }
  }
}
