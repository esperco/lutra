/*
  Component for adding and sharing new calendars
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="../marten/ts/Queue.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.Modal.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface CalAddProps {
    onDone: () => void;
  }

  interface CalAddState {
    selectedTeamId?: string;
  }

  export class CalAdd extends Component<CalAddProps, CalAddState>{
    constructor(props: CalAddProps) {
      super(props);
      // Init state = first team (if any)
      this.state = {
        selectedTeamId: Teams.first() && Teams.first().teamid
      };

      // Trigger async -> does nothing if already loaded
      ApiC.getCalendarList();
    }

    renderWithData() {
      var store = ApiC.getCalendarList.store;
      var key = ApiC.getCalendarList.strFunc([]);

      var calData = store.val(key);
      var calendars = calData && calData.calendars;
      var calMeta = store.metadata(key);
      var dataStatus = calMeta && calMeta.dataStatus;

      if (dataStatus === Model.DataStatus.FETCH_ERROR ||
          dataStatus === Model.DataStatus.PUSH_ERROR) {
        return <div className="alert compact alert-danger" role="alert">
          <i className="fa fa-fw fa-warning"></i>{" "}
          Whoops. Something broke.{" "}
          <a href="http://esper.com/contact">
            Please try contacting us at esper.com/contact.
          </a>
        </div>;
      }

      else if (dataStatus !== Model.DataStatus.READY) {
        return <div className="esper-spinner esper-centered esper-medium" />;
      }

      return <div>
        { this.renderTeamSelector() }
        <div className="list-group">
          { _.map(calendars, this.renderCalendar.bind(this)) }
        </div>
        { this.renderFooter() }
      </div>;
    }

    renderCalendar(cal: ApiT.Calendar) {
      var isSelected = false;
      var team = Teams.get(this.state.selectedTeamId);
      if (team) {
        isSelected = !!_.find(team.team_calendars,
          (c) => Calendars.getId(c) === Calendars.getId(cal)
        );
      }

      return <a key={Calendars.getId(cal)}
                onClick={() => this.selectCalendar(cal)}
                className={"list-group-item" + (isSelected ?
                           " list-group-item-success" : "")}>
        <i className={"fa fa-fw " + (isSelected ?
                      "fa-calendar-check-o" : "fa-calendar-o")} />{" "}
        {cal.calendar_title}
      </a>;
    }

    selectCalendar(cal: ApiT.Calendar) {
      var team = Teams.get(this.state.selectedTeamId);
      var isSelected = false;
      var _id: string;

      if (team) {
        _id = team.teamid;
        isSelected = !!_.find(team.team_calendars,
          (c) => Calendars.getId(c) === Calendars.getId(cal)
        );
      } else {
        _id = Teams.createDefaultTeam();
        this.setState({selectedTeamId: _id});
        team = Teams.get(_id);
      }

      if (isSelected) {
        Calendars.removeTeamCalendar(_id, cal);
      } else {
        Calendars.addTeamCalendar(_id, cal);
      }
    }

    renderTeamSelector() {
      var allTeams = Teams.all();
      if (allTeams && allTeams.length > 1) {
        return <div className="form-group">
          <select className="form-control"
                  value={this.state.selectedTeamId}
                  onChange={this.changeTeam.bind(this)}>
            {_.map(allTeams, (t) =>
              <option key={t.teamid} value={t.teamid}>{t.team_name}</option>
            )}
          </select>
        </div>;
      }
    }

    changeTeam(event: Event) {
      var target = event.target as HTMLOptionElement;
      this.setState({selectedTeamId: target.value})
    }

    renderFooter() {
      var dataStatus = Teams.dataStatus(this.state.selectedTeamId);
      var busy = dataStatus === Model.DataStatus.INFLIGHT;

      return <div className="clearfix modal-footer">
        { busy ?
          <div>
            <div className="esper-spinner" />
            <span className="esper-footer-text">
              Saving &hellip; this may take a minute
            </span>
          </div> :
          <button className="btn btn-secondary" onClick={this.props.onDone}>
            Done
          </button>
        }
      </div>;
    }
  }

  export class CalAddModal extends Component<{}, {}> {
    render() {
      return <Modal title="Connect Calendars to Esper"
                    icon="fa-calendar-check-o">
        <CalAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddCalendarsModal);
    }
  }
}
