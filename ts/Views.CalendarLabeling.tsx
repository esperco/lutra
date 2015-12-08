/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.Calendar.tsx" />
/// <refernece path="./Calendars.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Action to update our selection
  function updateSelection(teamId: string, calId: string) {
    var current = Calendars.selectStore.val();

    // Update only if calendar doesn't match (to avoid clobbering events)
    if (!current || current.teamId !== teamId || current.calId !== calId) {
      Calendars.selectStore.set({teamId: teamId, calId: calId, events: []});
    }
  }

  function updateEvent(eventId: string, eventTitle: string, add: boolean) {
    Calendars.selectStore.set(function(oldData) {
      var newData = _.cloneDeep(oldData);
      newData.events = newData.events || [];
      var selected = _.find(newData.events, (e) => e.id === eventId);

      // Add => cumulative, shift key is down
      if (add) {
        if (selected) {
          newData.events = _.filter(newData.events, (e) => e.id !== eventId);
        } else {
          newData.events.push({
            id: eventId,
            title: eventTitle
          });
        }
      }

      // Exclusive, select one event only
      else if (selected) {
        newData.events = [];
      } else {
        newData.events = [{
          id: eventId,
          title: eventTitle
        }];
      }

      // Switch to minimized state for calendar selector as soon as we pick
      // an event so we can start labeling right away
      if (!selected && !calSelectMinStore.isSet()) {
        calSelectMinStore.set(true);
      }

      return newData;
    });
  }

  function setDefaults() {
    if (! Calendars.selectStore.isSet()) {
      Calendars.selectStore.set(_.extend({
        events: []
      }, Calendars.defaultSelection()) as Calendars.CalSelection);
    }
  }

  // Store to track minimized state of cal selector
  var calSelectMinStore = new Model.StoreOne<boolean>();

  function toggleMinCalSelect() {
    var current = calSelectMinStore.val();
    calSelectMinStore.set(!current);
  }

  // Export with prefix for testing
  export var clCalSelectMinStore = calSelectMinStore;

  ////

  interface CalendarLabelingState {
    selectedCal: Calendars.CalSelection;
    minimizeCalSelector: boolean;
  }

  export class CalendarLabeling extends Component<{}, CalendarLabelingState> {
    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    render() {
      if (this.state.selectedCal) {
        var selectedTeamId = this.state.selectedCal.teamId;
        var selectedCalId = this.state.selectedCal.calId;
      }

      return <div id="calendar-page"
                  className="esper-full-screen minus-nav">
        <div className="container-fluid"><div className="row">
          <div className="col-xs-5 col-sm-3 col-lg-2 esper-left-sidebar padded">
            <Components.CalSelector
              selectedTeamId={selectedTeamId}
              selectedCalId={selectedCalId}
              updateFn={updateSelection}
              minimized={this.state.minimizeCalSelector}
              toggleMinimized={toggleMinCalSelect}
            />
            {this.renderLabelEditor()}
          </div>
          <div
            className="col-xs-7 col-sm-9 col-lg-10 esper-right-content padded">
            {this.renderCalendar()}
          </div>
        </div></div>
      </div>;
    }

    renderCalendar() {
      if (!this.state.selectedCal || !this.state.selectedCal.calId) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar
        </span>);
      }

      return <Components.Calendar
        teamId={this.state.selectedCal.teamId}
        calId={this.state.selectedCal.calId}
        eventIds={_.map(this.state.selectedCal.events, (e) => e.id)}
        updateFn={updateEvent}
      />;
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className="esper-expanded padded">
        <div className="panel panel-default esper-focus-message">
          <div className="panel-body">
            {elm}
          </div>
        </div>
      </div>;
    }

    renderLabelEditor() {
      if (this.state.selectedCal &&
          this.state.selectedCal.events &&
          this.state.selectedCal.events.length > 0) {
        return <Components.LabelEditor
          teamId={this.state.selectedCal.teamId}
          calId={this.state.selectedCal.calId}
          events={this.state.selectedCal.events}
        />;
      } else {
        return <span />;
      }
    }

    componentDidMount() {
      this.setSources([
        Calendars.selectStore,
        calSelectMinStore
      ]);
    }

    getState() {
      return {
        selectedCal: Calendars.selectStore.val(),
        minimizeCalSelector: calSelectMinStore.val()
      }
    }
  }
}

