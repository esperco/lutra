/*
  General settings page
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamGeneralSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.general;

    renderMain(team: ApiT.Team) {
      var status = Stores.Profiles.status();
      if (status === Model2.DataStatus.FETCHING) {
        return <div className="esper-spinner esper-medium esper-centered" />;
      }

      if (status === Model2.DataStatus.FETCH_ERROR) {
        return <div className="panel panel-default">
          <div className="panel-body">
            <Components.ErrorMsg />
          </div>
        </div>;
      }

      var busy = Stores.Teams.status(this.props.teamId).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.INFLIGHT
      });
      var error = Stores.Teams.status(this.props.teamId).match({
        none: () => true,
        some: (d) => d === Model2.DataStatus.PUSH_ERROR
      });

      var exec = Stores.Profiles.get(team.team_executive);
      var assistants = Option.flatten(
        _.map(team.team_assistants,
          (uid) => Stores.Profiles.get(uid)
        )
      );
      var profilesLoading =
        Stores.Profiles.getInitPromise().state() === "pending";
      var prefs = Stores.Preferences.get(team.teamid)
        .flatMap((p) => Option.some(p.general));

      return <div>
        <TeamInfo
          exec={exec} prefs={prefs} team={team}
          busy={busy} error={error}
        />

        <SharingSettings team={team} profiles={assistants} />

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
                    onOK={() => this.save()} okText="Save">
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


  /* Sharing -> add/remove assistants */

  function SharingSettings({team, profiles}: {
    team: ApiT.Team;
    profiles: ApiT.Profile[];
  }) {
    profiles = _.filter(profiles, (p) => p.profile_uid !== Login.myUid());
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        { profiles.length ? <div>
          <div className="alert alert-info text-center">
            { team.team_executive === Login.myUid() ?
              Text.SelfAssistantsDescription :
              Text.ExecAssistantsDescription
            }
          </div>
          <div className="list-group">{ _.map(profiles, (p) =>
            <div key={p.profile_uid} className="list-group-item">
              <i className="fa fa-fw fa-user" />{" "}
              { p.display_name }
              { p.display_name === p.email ? "" : ` (${p.email})`}
              <a className="pull-right action rm-action"
                 title={Text.RemoveAssistant}
                 onClick={() => removeAssistant(team.teamid, p)}>
                <i className="fa fa-fw fa-close list-group-item-text" />
              </a>
            </div>
          )}</div>
        </div>: null }

        <InviteInput team={team} />
      </div>


    </div>;
  }

  function removeAssistant(teamId: string, p: ApiT.Profile) {
    Actions.Assistants.remove(teamId, p.profile_uid)
  }


  /* Interface for adding a team member */

  class InviteInput extends ReactHelpers.Component<{team: ApiT.Team}, {
    busy?: boolean;
    error?: boolean;
    success?: boolean;
    validationError?: boolean;
  }> {
    _input: HTMLInputElement;

    constructor(props: {team: ApiT.Team}) {
      super(props);
      this.state = {
        busy: false,
        error: false,
        success: false,
        validationError: false
      };
    }

    render() {
      return <div>
        { this.state.success ?
          <div className="alert alert-success text-center">
            <i className="fa fa-fw fa-check" />{" "}
            { Text.InviteAssistantSuccess }
          </div> : null }

        { this.state.error ? <Components.ErrorMsg /> : null }

        <div className={classNames({"has-error": this.state.validationError})}>
          <label htmlFor={this.getId("email")}>
            { this.props.team.team_executive === Login.myUid() ?
              Text.SelfInviteAssistant :
              Text.ExecInviteAssistant
            }
          </label>
          <div className="input-group">
            <input ref={(c) => this._input = c} id={this.getId("email")}
                   type="text" className="form-control"
                   onKeyDown={(e) => this.inputKeydown(e)}
                   disabled={this.state.busy}
                   placeholder="someone@email.com" />
            <span className="input-group-btn">
              <button className="btn btn-default" type="button"
                      onClick={() => this.send()} disabled={this.state.busy}>
                <i className="fa fa-fw fa-send" />
              </button>
            </span>
          </div>
        </div>
      </div>;
    }

    // Catch enter / up / down keys
    inputKeydown(e: __React.KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        this.send();
      } else if (e.keyCode === 27) {  // ESC
        e.preventDefault();
        $(e.target as HTMLInputElement).val("");
      }
    }

    send() {
      var value: string = $(this._input).val();
      if (Util.validateEmailAddress(value)) {
        this.setState({
          busy: true,
          error: false,
          success: false,
          validationError: false
        });

        Actions.Assistants.add(this.props.team.teamid, value)
          .done(() => {
            $(this._input).val("");
            this.setState({ busy: false, success: true });
          })
          .fail(() => this.setState({ busy: false, error: true }));
      }

      // Invalid email address
      else {
        this.setState({
          busy: false,
          error: false,
          success: false,
          validationError: true
        });
      }
    }
  }


  /* Deactivate Account */

  function RemoveTeam({team} : {team: ApiT.Team}) {
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




