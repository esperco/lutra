/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.Calendar.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Store for currently selected team and calendar
  interface CalSelection {
    teamId: string;
    calId: string;
  }
  var calSelectStore = new Model.StoreOne<CalSelection>();

  // Action to update our selection -- also triggers async calls
  function updateSelection(teamId: string, calId: string) {
    var current = calSelectStore.val();
    calSelectStore.set({teamId: teamId, calId: calId});
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

