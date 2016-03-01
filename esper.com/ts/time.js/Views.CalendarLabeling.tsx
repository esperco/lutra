/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />
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

  ////

  export class CalendarLabeling extends Component<{}, {}> {
    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    renderWithData() {
      calendarLabelUpdateStore.get();
      var selectedCal = Calendars.SelectStore.val();

      return <div id="calendar-page"
                  className="esper-full-screen minus-nav">
        <div className="esper-left-sidebar padded">
          <div className="esper-menu-section">
            <label htmlFor={this.getId("cal-select")}>
              Calendar
            </label>
            <Components.CalSelectorDropdown
              id={this.getId("cal-select")}
              selected={selectedCal ? [selectedCal] : []}
              updateFn={updateSelection}
            />
          </div>
          {this.renderLabelEditor()}
        </div>
        <div className="esper-right-content padded">
          {this.renderCalendar()}
        </div>
      </div>;
    }

    renderCalendar() {
      var selectedCal = Calendars.SelectStore.val();
      if (!selectedCal || !selectedCal.calId) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar
        </span>);
      }

      return <Components.Calendar
        forceUpdate={calendarLabelUpdateStore.val()}
        teamId={selectedCal.teamId}
        calId={selectedCal.calId}
        eventIds={_.map(selectedCal.events, (e) => e.id)}
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
      var selectedCal = Calendars.SelectStore.val();
      if (selectedCal &&
          selectedCal.events &&
          selectedCal.events.length > 0) {
        var eventPairs = _.filter(_.map(selectedCal.events,
          (e) => Events.EventStore.get(e.id)
        ));
        var teamPairs = _.map(Teams.all(),
        (t) => Option.cast(Teams.teamStore.metadata(t.teamid))
          .match<[ApiT.Team, Model.StoreMetadata]>({
            none: () => null,
            some: (m) => [t, m]
          }));

        var heading = (eventPairs.length === 1 ?
          eventPairs[0][0].title || "1 Event Selected":
          eventPairs.length + " Events Selected"
        );
        var hasRecurring = false;
        if (_.find(eventPairs, (e) => !!e[0].recurring_event_id)) {
          hasRecurring = true;
        }

        return <div className="esper-menu-section">
          <div className="esper-subheader select-labels-heading">
            {heading}
            { hasRecurring ?
              <span className="recurring-note">
                {" "}+ Recurring
              </span>: ""
            }
            { eventPairs.length === 1 ?
              <span className="shift-note">
                {" "}(Hold Shift to Select Multiple Events)
              </span>: ""
            }
         </div>
          <Components.LabelEditor2
            eventPairs={eventPairs}
            teamPairs={teamPairs}
          />
        </div>;
      } else {
        return <div className="esper-menu-section">
          <div className="esper-no-content">
            Select a Calendar Event
          </div>
        </div>;
      }
    }
  }
}

