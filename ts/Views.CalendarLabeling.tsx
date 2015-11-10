/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.Calendar.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Store for currently selected team, calendar, and event
  interface CalSelection {
    teamId: string;
    calId: string;
    eventId?: string;
    eventTitle?: string;
  }
  var calSelectStore = new Model.StoreOne<CalSelection>();

  // Action to update our selection
  function updateSelection(teamId: string, calId: string) {
    var current = calSelectStore.val();

    // Update only if calendar doesn't match (to avoid clobbering eventId)
    if (!current || current.teamId !== teamId || current.calId !== calId) {
      calSelectStore.set({teamId: teamId, calId: calId});
    }
  }

  function updateEvent(eventId: string, eventTitle?: string) {
    calSelectStore.set(function(oldData) {
      var newData = _.cloneDeep(oldData);
      newData.eventId = eventId;
      newData.eventTitle = eventTitle;
      return newData;
    });

    // Trigger async calls
    ApiC.getTaskListForEvent(eventId, false, false);
  }

  ////

  interface CalendarLabelingState {
    selectedCal: CalSelection;
  }

  export class CalendarLabeling extends Component<{}, CalendarLabelingState> {
    render() {
      if (this.state.selectedCal) {
        var selectedTeamId = this.state.selectedCal.teamId;
        var selectedCalId = this.state.selectedCal.calId;
      }

      return <div id="calendar-page"
                  className="esper-full-screen minus-nav">
        <div className="container-fluid"><div className="row">
          <div className="col-sm-3 col-lg-2 esper-left-sidebar padded">
            <Components.CalSelector
              selectedTeamId={selectedTeamId}
              selectedCalId={selectedCalId}
              updateFn={updateSelection} />
            {this.renderLabelEditor()}
          </div>
          <div className="col-sm-9 col-lg-10 esper-right-content padded">
            {this.renderCalendar()}
          </div>
        </div></div>
      </div>;
    }

    renderCalendar() {
      if (! this.state.selectedCal) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar
        </span>);
      }

      return <Components.Calendar
        teamId={this.state.selectedCal.teamId}
        calId={this.state.selectedCal.calId}
        eventId={this.state.selectedCal.eventId}
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
      if (this.state.selectedCal && this.state.selectedCal.eventId) {
        return <Components.LabelEditor
          teamId={this.state.selectedCal.teamId}
          calId={this.state.selectedCal.calId}
          eventId={this.state.selectedCal.eventId}
          eventTitle={this.state.selectedCal.eventTitle}
        />;
      } else {
        return <span />;
      }
    }

    componentDidMount() {
      this.setSources([
        calSelectStore,
      ]);
    }

    getState() {
      return {
        selectedCal: calSelectStore.val()
      }
    }
  }
}

