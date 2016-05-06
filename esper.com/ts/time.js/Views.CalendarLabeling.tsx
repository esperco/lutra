/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Stores.Teams.ts" />
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
    period: Period.Single;
  }

  export class CalendarLabeling extends ReactHelpers.Component<Props, {
    selected: {
      teamId: string;
      calId: string;
      eventId: string;
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
      var teams = Stores.Teams.all();
      var calendarsByTeamId = (() => {
        var ret: {[index: string]: ApiT.GenericCalendar[]} = {};
        _.each(teams, (t) => {
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
              allowMulti={true}
            />
          </div>
          {this.renderLabelEditor()}
        </Components.SidebarWithToggle>
        <div className="esper-right-content padded"
             onClick={() => this.clearEventSelection()}>
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

      var eventsData = Option.flatten(
        _.map(this.props.cals,
          (cal) => Events2.getForPeriod({
            teamId: cal.teamId,
            calId: cal.calId,
            period: this.props.period
          }))
      );
      var isBusy = !!_.find(eventsData, (e) => e.isBusy);
      var hasError = !!_.find(eventsData, (e) => e.hasError);

      var events = _.flatten(_.map(eventsData, (e) => e.events));
      var selectedEvents = _.filter(events, (e) =>
        !!_.find(this.state.selected, (s) =>
          s.teamId === e.teamId &&
          s.calId === e.calendar_id &&
          s.eventId === e.id
        )
      );

      return <Components.Calendar
        period={this.props.period}
        events={events}
        selectedEvents={selectedEvents}
        busy={isBusy}
        error={hasError}
        onViewChange={(period) => this.updatePeriod(period)}
        onEventClick={(event, add) => this.updateEventSelection(event, add)}
      />;
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className={"esper-expanded padded panel panel-default " +
                             "esper-no-content"}>
        <div className="panel-body">
          {elm}
        </div>
      </div>;
    }

    renderLabelEditor() {
      var eventData = Option.flatten(
        _.map(this.state.selected, (s) => Events2.EventStore.get({
          teamId: s.teamId,
          calId: s.calId,
          eventId: s.eventId
        }))
      );

      if (eventData.length) {
        var heading = (eventData.length === 1 ?
          eventData[0].data.match({
            none: () => "",
            some: (e) => e.title
          }) || "1 Event Selected" :
          eventData.length + " Events Selected"
        );
        var hasRecurring = false;
        if (_.find(eventData, (e) => e.data.match({
          none: () => false,
          some: (e) => !!e.recurring_event_id
        }))) {
          hasRecurring = true;
        }

        return <div className="esper-menu-section sidebar-event-editor">
          <div className="esper-subheader select-labels-heading">
            {heading}
            { hasRecurring ?
              <span className="recurring-note esper-note">
                {" "}+ Recurring
              </span>: ""
            }
            { eventData.length === 1 ?
              <div className="shift-note esper-note">
                {" "}(Hold Shift to Select Multiple Events)
              </div>: ""
            }
          </div>
          <Components.EventEditor eventData={eventData}
                                  teams={Stores.Teams.all()}
                                  focusOnLabels={true}
                                  minFeedback={true} />
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
      this.updateRoute({
        cals: selections,
        period: this.props.period
      });
    }

    updatePeriod(period: Period.Single) {
      this.updateRoute({
        cals: this.props.cals,
        period: period
      });
    }

    updateRoute(props: Props) {
      var pathForCals = Params.pathForCals(props.cals);
      Route.nav.path([
        "calendar-labeling",
        pathForCals[0],
        pathForCals[1],
        props.period.interval[0],
        props.period.index.toString()
      ]);
    }

    clearEventSelection() {
      this.setState({ selected: [] });
    }

    updateEventSelection(event: Events2.TeamEvent, add: boolean) {
      var selectedList = _.cloneDeep(this.state.selected);
      var selectedIndex = _.findIndex(selectedList,
        (s) => Events2.matchId(event, s)
      );

      // Add => cumulative, shift key is down
      if (add) {
        if (selectedIndex >= 0) {
          selectedList.splice(selectedIndex, 1);
        } else {
          selectedList.push(Events2.storeId(event));
        }
      }

      // Exclusive, select one event only
      else if (selectedIndex >= 0) {
        selectedList = [];
      } else {
        selectedList = [Events2.storeId(event)];
      }

      // Set state to trigger display changes
      this.setState({
        selected: selectedList
      });
    }
  }
}

