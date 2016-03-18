/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelEditor2.tsx" />
/// <reference path="./Components.Calendar.tsx" />
/// <refernece path="./Calendars.ts" />

module Esper.Views {
  interface Props {
    cals: {
      teamId: string;
      calId: string;
    }[];
  }

  export class CalendarLabeling extends ReactHelpers.Component<Props, {
    selected: {
      teamId: string;
      calId: string;
      eventIds: string[];
    }[]
  }> {
    constructor(props: Props) {
      super(props);
      this.state = {selected: []};
    }

    componentWillReceiveProps(newProps: Props) {
      if (! _.isEqual(newProps.cals, this.props.cals)) {
        this.setState({selected: []});
      }
    }

    renderWithData() {
      var teams = Teams.all();
      var calendarsByTeamId = (() => {
        var ret: {[index: string]: ApiT.GenericCalendar[]} = {};
        _.each(Teams.all(), (t) => {
          ret[t.teamid] = Calendars.CalendarListStore.val(t.teamid)
        });
        return ret;
      })();

      return <div id="calendar-page"
                  className="esper-full-screen minus-nav">
        <Components.SidebarWithToggle>
          <div className="esper-menu-section">
            <label htmlFor={this.getId("cal-select")}>
              <i className="fa fa-fw fa-calendar-o" />{" "}
              Calendar
            </label>
            <Components.CalSelectorDropdown
              id={this.getId("cal-select")}
              selected={this.props.cals}
              updateFn={(x) => this.updateCalSelection(x)}
              teams={teams}
              calendarsByTeamId={calendarsByTeamId}
            />
          </div>
          {this.renderLabelEditor()}
        </Components.SidebarWithToggle>
        <div className="esper-right-content padded">
          {this.renderCalendar()}
        </div>
      </div>;
    }

    renderCalendar() {
      if (! this.props.cals.length) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar
        </span>);
      }

      // Just one cal for now
      var selectedCal = this.props.cals[0];

      // Get events for selectedCal
      var selectedEventsForCal = _.find(this.state.selected,
        (s) => s.calId === selectedCal.calId &&
               s.teamId === selectedCal.teamId);
      var eventIds = selectedEventsForCal ? selectedEventsForCal.eventIds : [];

      return <Components.Calendar
        teamId={selectedCal.teamId}
        calId={selectedCal.calId}
        eventIds={eventIds}
        updateFn={(eventId, add) => this.updateEventSelection(eventId, add)}
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
      var eventPairs = _.filter(_.flatten(
        _.map(this.state.selected, (s) => _.map(s.eventIds,
          (eventStoreId) => Events.EventStore.get(eventStoreId)
        ))
      ));

      if (eventPairs.length) {
        var teamPairs = Teams.allPairs();
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
              <span className="recurring-note esper-note">
                {" "}+ Recurring
              </span>: ""
            }
            { eventPairs.length === 1 ?
              <div className="shift-note esper-note">
                {" "}(Hold Shift to Select Multiple Events)
              </div>: ""
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


    /////////

    updateCalSelection(selections: Calendars.CalSelection[]) {
      Route.nav.query({
        cals: selections
      } as Actions.EventFilterJSON);
    }

    updateEventSelection(eventId: string, add: boolean) {
      // Only one cal for now -- update if we display multiple
      var cal = this.props.cals[0];

      var selected = _.cloneDeep(this.state.selected);
      var selectedCal = _.find(selected, (s) => s.calId === cal.calId &&
                                                s.teamId === cal.teamId);
      if (! selectedCal) {
        selectedCal = {
          teamId: cal.teamId,
          calId: cal.calId,
          eventIds: []
        };
        if (add) {
          selected.push(selectedCal)
        } else {
          selected = [selectedCal];
        }
      }

      var eventSelected = _.includes(selectedCal.eventIds, eventId);

      // Add => cumulative, shift key is down
      if (add) {
        if (eventSelected) {
          selectedCal.eventIds = _.without(selectedCal.eventIds, eventId);
        } else {
          selectedCal.eventIds.push(eventId);
        }
      }

      // Exclusive, select one event only
      else if (eventSelected) {
        selected = [];
      } else {
        selectedCal.eventIds = [eventId];
      }

      // Set state to trigger display changes
      this.setState({
        selected: selected
      });
    }
  }
}

