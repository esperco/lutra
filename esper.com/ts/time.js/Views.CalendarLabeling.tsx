/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.Calendar.tsx" />
/// <refernece path="./Calendars.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Store used to trigger force update
  var calendarLabelUpdateStore = new Model.StoreOne<number>();

  export function forceCalendarLabelingUpdate() {
    calendarLabelUpdateStore.set(Math.random());
  }


  // Action to update our selection
  function updateSelection(selections: Calendars.CalSelection[]) {
    var current = Calendars.SelectStore.val();
    var selection = selections[0];

    // Update only if calendar doesn't match (to avoid clobbering events)
    if (selection && !current ||
        current.teamId !== selection.teamId ||
        current.calId !== selection.calId) {
      selection.events = [];
      Calendars.SelectStore.set(selection);
    }
  }

  function updateEvent(eventId: string, eventTitle: string, add: boolean) {
    Calendars.SelectStore.set(function(oldData) {
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
    if (! Calendars.SelectStore.isSet()) {
      Calendars.SelectStore.set(_.extend({
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
    _calSelector: Components.CalSelector;

    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    render() {
      return <div id="calendar-page"
                  className="esper-full-screen minus-nav">
        <div className="esper-left-sidebar padded">
          <Components.CalSelector
            ref={(c) => this._calSelector = c}
            selected={this.state.selectedCal ? [this.state.selectedCal] : []}
            updateFn={updateSelection}
            minimized={this.state.minimizeCalSelector}
            toggleMinimized={toggleMinCalSelect}
          />
          {this.renderLabelEditor()}
        </div>
        <div className="esper-right-content padded">
          {this.renderCalendar()}
        </div>
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
        forceUpdate={calendarLabelUpdateStore.val()}
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
        Calendars.SelectStore,
        calSelectMinStore,
        calendarLabelUpdateStore
      ]);
    }

    getState() {
      return {
        selectedCal: Calendars.SelectStore.val(),
        minimizeCalSelector: calSelectMinStore.val()
      }
    }
  }
}

