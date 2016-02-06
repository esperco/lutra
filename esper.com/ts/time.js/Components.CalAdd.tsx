/*
  Component for adding and sharing new calendars
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.RequestExec.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface CalAddProps {
    disableDone?: boolean;
    doneText?: string;
    onDone?: () => void;
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
      var info = Login.InfoStore.val();
      var isNylas = (info.platform === "Nylas");
      var currentTeam = Teams.get(this.state.selectedTeamId);
      var teamStatus = Teams.dataStatus(this.state.selectedTeamId);

      var calendars: ApiT.Calendar[];
      var dataStatus: Model.DataStatus;

      // If non-self-exec Nylas, calendar list is for current team (if set)
      if (isNylas && currentTeam &&
          currentTeam.team_executive !== Login.myUid())
      {
        calendars = currentTeam.team_calendars;
        dataStatus = Teams.dataStatus(this.state.selectedTeamId);
      }

      // Else, fetch the list of calendars for this user
      else {
        var store = ApiC.getCalendarList.store;
        var key = ApiC.getCalendarList.strFunc([]);

        var calData = store.val(key);
        calendars = calData && calData.calendars;
        var calMeta = store.metadata(key);
        dataStatus = calMeta && calMeta.dataStatus;
      }

      if (dataStatus === Model.DataStatus.FETCH_ERROR ||
          dataStatus === Model.DataStatus.PUSH_ERROR ||
          teamStatus === Model.DataStatus.FETCH_ERROR ||
          teamStatus === Model.DataStatus.PUSH_ERROR)
      {
        return <Components.ErrorMsg />;
      }

      else if (dataStatus !== Model.DataStatus.READY &&
               dataStatus !== Model.DataStatus.UNSAVED)
      {
        return <div className="esper-spinner esper-centered esper-medium" />;
      }

      return <div>
        { this.renderTeamSelector() }
        { isNylas && currentTeam &&
          !(currentTeam.team_approved && calendars && calendars.length) ?

          // Not approved or no calendars shared
          <div className="esper-no-content">
            Waiting for calendar owner to grant access.
          </div> :

          // Approved (or not Nylas)
          <div>
            { isNylas && currentTeam &&
              currentTeam.team_executive !== Login.myUid() ?
              <div className="alert alert-warning">
                You do not have permission to add calendars for this
                account. You may remove calendars, but you will need the
                calendar owner to log in to re-grant access to access any
                calendars you have removed.
              </div> : null
            }
            { calendars && calendars.length ?
              // Calendars
              <div>
                <label>Select Calendars</label>
                <div className="list-group">
                  { _.map(calendars, this.renderCalendar.bind(this)) }
                </div>
              </div> :

              // No calendars
              <div className="esper-no-content">
                No calendars found
              </div>
            }
          </div>
        }

        { isNylas ?
          <Components.RequestExec
            onSave={this.changeTeamPromise.bind(this)}
          /> :
          <div className="well">
            Don't see the calendar you want? Ask the owner to {" "}
            <a href="https://support.google.com/calendar/answer/37082?hl=en">
            share it with you on Google</a>.
          </div>
        }
        { this.renderFooter() }
      </div>;
    }

    renderCalendar(cal: ApiT.Calendar) {
      var genCal = Calendars.asGeneric(cal);
      var calList = Calendars.CalendarListStore.val(this.state.selectedTeamId);
      var isSelected = calList &&
        !!_.find(calList,
          (c) => c.id === genCal.id
        );

      return <a key={genCal.id}
                onClick={() => this.selectCalendar(cal)}
                className={"list-group-item" + (isSelected ?
                           " list-group-item-success" : "")}>
        <i className={"fa fa-fw " + (isSelected ?
                      "fa-calendar-check-o" : "fa-calendar-o")} />{" "}
        {genCal.title}
      </a>;
    }

    selectCalendar(cal: ApiT.Calendar) {
      var _id = this.state && this.state.selectedTeamId;
      if (! _id) {
        _id = Teams.createDefaultTeam();
        this.setState({selectedTeamId: _id});
      }

      var genCal = Calendars.asGeneric(cal);
      var calList = Calendars.CalendarListStore.val(this.state.selectedTeamId);
      var isSelected = calList &&
        !!_.find(calList,
          (c) => c.id === genCal.id
        );

      if (isSelected) {
        Calendars.removeTeamCalendar(_id, cal);
      } else {
        Calendars.addTeamCalendar(_id, cal);
      }
    }

    renderTeamSelector() {
      var allTeamIds = Teams.allIds() || [];
      var loginInfo = Login.InfoStore.val();
      var isNylas = loginInfo.platform === "Nylas";
      if (allTeamIds.length > 1) {
        return <div className="form-group">
          <label htmlFor={this.getId("team-select")} className="control-label">
            { isNylas ? "Calendar Owner" : "Executive Team" }
          </label>
          <select id={this.getId("team-select")} className="form-control"
                  value={this.state.selectedTeamId}
                  onChange={this.changeTeamEvent.bind(this)}>
            {_.map(allTeamIds, (_id) => {
              var t = Teams.get(_id);
              if (t) {
                return <option key={_id} value={_id}>{t.team_name}</option>;
              }
            })}
          </select>
        </div>;
      }
    }

    changeTeamEvent(event: Event) {
      var target = event.target as HTMLOptionElement;
      this.setState({selectedTeamId: target.value});
    }

    changeTeamPromise(p: JQueryPromise<ApiT.Team>) {
      p.done((team) => {
        this.setState({selectedTeamId: team.teamid});
      });
    }

    renderFooter() {
      var dataStatus = Teams.dataStatus(this.state.selectedTeamId);
      var busy = dataStatus === Model.DataStatus.INFLIGHT;

      // Don't render footer if no done option and we don't need to show
      // busy indicator
      if (!this.props.onDone && !busy) {
        return;
      }

      return <div className="clearfix modal-footer">
        { busy ?
          <div>
            <div className="esper-spinner" />
            <span className="esper-footer-text">
              Saving &hellip; this may take a minute
            </span>
          </div> :
          <button className="btn btn-secondary" onClick={this.props.onDone}
                  disabled={this.props.disableDone}>
            {this.props.doneText || "Done"}
          </button>
        }
      </div>;
    }
  }

  export class CalAddModal extends Component<{
    onHidden?: () => void;
  }, {}> {
    render() {
      return <Modal title="Connect Calendars to Esper"
                    icon="fa-calendar-check-o"
                    onHidden={this.props.onHidden}>
        { Onboarding.needsCalendars() ?
          <div className="alert alert-info">
            Which calendars do you use to track your time?
          </div> : null
        }
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
