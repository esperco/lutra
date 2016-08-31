/*
  Calendar page
*/

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
      var calendarsByTeamId = Stores.Calendars.byTeamId();

      return <div id="calendar-page" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
          <div className="esper-panel-section">
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
        </Components.Sidebar>
        <div className="esper-content"
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

      var { isBusy, hasError, events} = Stores.Events.require({
        cals: this.props.cals,
        period: this.props.period
      });
      var selectedEvents = _.filter(events, (e) =>
        !!_.find(this.state.selected, (s) =>
          s.teamId === e.teamId &&
          s.calId === e.calendarId &&
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
      return <div className="esper-expanded">
        <div className="esper-no-content">
          {elm}
        </div>
      </div>;
    }

    renderLabelEditor() {
      var eventData = Option.flatten(
        _.map(this.state.selected, (s) => Stores.Events.EventStore.get({
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
          some: (e) => !!e.recurringEventId
        }))) {
          hasRecurring = true;
        }

        return <div className="esper-panel-section sidebar-event-editor">
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
          <Components.EventEditor
            eventData={eventData}
            teams={Stores.Teams.getFromCalSelection(this.props.cals)}
            focusOnLabels={true}
            minFeedback={true}
          />
        </div>;
      } else {
        return <div className="esper-panel-section">
          <div className="esper-no-content">
            Select a Calendar Event
          </div>
        </div>;
      }
    }


    /////////

    updateCalSelection(selections: Stores.Calendars.CalSelection[]) {
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

    updateEventSelection(event: Stores.Events.TeamEvent, add: boolean) {
      var selectedList = _.cloneDeep(this.state.selected);
      var selectedIndex = _.findIndex(selectedList,
        (s) => Stores.Events.matchId(event, s)
      );

      // Add => cumulative, shift key is down
      if (add) {
        if (selectedIndex >= 0) {
          selectedList.splice(selectedIndex, 1);
        } else {
          selectedList.push(Stores.Events.storeId(event));
        }
      }

      // Exclusive, select one event only
      else if (selectedIndex >= 0) {
        selectedList = [];
      } else {
        selectedList = [Stores.Events.storeId(event)];
      }

      // Confirm before opening modal
      Actions.EventLabels.confirm([event]);

      // Set state to trigger display changes
      this.setState({
        selected: selectedList
      });
    }
  }
}

