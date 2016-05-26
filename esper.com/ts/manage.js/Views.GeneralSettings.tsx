/*
  General settings page
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class GeneralSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.general;

    renderMain(team: ApiT.Team) {
      var busy = Stores.Teams.status(this.props.teamId).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.INFLIGHT
      });
      var error = Stores.Teams.status(this.props.teamId).match({
        none: () => true,
        some: (d) => d === Model2.DataStatus.PUSH_ERROR
      });

      var exec = Stores.Profiles.get(team.team_executive);
      var prefs = Stores.Preferences.get(team.teamid)
        .flatMap((p) => Option.some(p.general));

      return <div>
        <TeamInfo
          exec={exec} prefs={prefs} team={team}
          busy={busy} error={error}
        />

        <RemoveTeam team={team} />
      </div>;
    }
  }


  /* Separate component for the team settings */

  interface Props {
    team: ApiT.Team;
    exec: Option.T<ApiT.Profile>;        // Exec
    prefs: Option.T<ApiT.GeneralPrefs>;  // Prefs
    busy?: boolean;
    error?: boolean;
  }

  interface State {
    didSave?: boolean;
  }

  export class TeamInfo extends ReactHelpers.Component<Props, State> {
    _form: Components.TeamForm;
    _saveId = Util.randomString();

    constructor(props: Props) {
      super(props);
      this.state = {
        didSave: false
      }
    }

    render() {
      return <div className="panel panel-default">
        <div className="panel-body">
          {
            this.props.exec.join(this.props.prefs,
              (exec, prefs) => Option.some({exec: exec, prefs: prefs})
            ).match({
              none: () => <div className="esper-spinner esper-centered" />,
              some: ({exec, prefs}) =>
                <Components.ModalPanel
                    busy={this.props.busy}
                    error={this.props.error}
                    success={this.state.didSave &&
                             !this.props.busy && !this.props.error}
                    onCancel={() => this.save()} cancelText="Save">
                  <Components.TeamForm ref={(c) => this._form = c}
                    name={this.props.team.team_name}
                    email={exec.email}
                    timezone={prefs.current_timezone}
                    showEmail={true}
                    editableEmail={false}
                    onUpdate={() => this.delayedSave()}
                  />
                </Components.ModalPanel>
            })
          }
        </div>
      </div>;
    }

    // Save after inactivity
    delayedSave() {
      this.setState({ didSave: false });
      Util.delayOne(this._saveId, () => this.save(), 2000);
    }

    save() {
      if (this._form) {
        this._form.validate().match({
          none: () => null,
          some: (d) => {
            this.setState({ didSave: true });
            Actions.Teams.updateTeam(this.props.team.teamid, {
              name: d.name,
              timezone: d.timezone
            });
          }
        });
      }
    }
  }


  /* Deactivate Account = really just remove calendars */

  export function RemoveTeam({team} : {team: ApiT.Team}) {
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        <span className="control-label esper-input-align">
          { Text.removeTeamDescription(team.team_name) }
        </span>
        <button className="pull-right btn btn-danger"
          onClick={() => removeTeam(team)}>
          { Text.RemoveTeamBtn }
        </button>
      </div>
    </div>;
  }

  function removeTeam(team: ApiT.Team) {
    Actions.Teams.removeTeam(team.teamid);
    Route.nav.go(Paths.Manage.Team.general());
  }
}




