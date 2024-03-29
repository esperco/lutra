/*
  General settings page
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamGeneralSettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.general;

    renderMain(team: ApiT.Team) {
      var status = Stores.Profiles.status();
      var profilesLoading =
        Stores.Profiles.getInitPromise().state() === "pending";
      if (status === Model2.DataStatus.FETCHING || profilesLoading) {
        return <div className="esper-spinner" />;
      }

      if (status === Model2.DataStatus.FETCH_ERROR) {
        return <div className="panel panel-default">
          <div className="panel-body">
            <Components.ErrorMsg />
          </div>
        </div>;
      }

      var busy = Stores.Teams.status(this.props.teamId)
        .mapOr(false, (d) => d === Model2.DataStatus.INFLIGHT);
      var error = Stores.Teams.status(this.props.teamId)
        .mapOr(true, (d) => d === Model2.DataStatus.PUSH_ERROR);

      var members = Option.flatten(
        _.map(team.team_assistants,
          (uid) => Stores.Profiles.get(uid)
        )
      );
      var exec = Stores.Profiles.get(team.team_executive);
      exec.match({
        none: () => null,
        some: (e) => members.unshift(e)
      });

      // Fix possible duplication between exec and assistants
      members = _.uniqBy(members, (m) => m.profile_uid);

      var prefs = Stores.TeamPreferences.get(team.teamid)
        .flatMap((p) => Option.some(p.general));

      return <div>
        <TeamInfo
          exec={exec} prefs={prefs} team={team}
          busy={busy} error={error}
        />

        <SharingSettings team={team} profiles={members} />
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
      return this.props.exec.join(this.props.prefs,
        (exec, prefs) => Option.some({exec: exec, prefs: prefs})
      ).mapOr(
        <div className="panel panel-default">
          <div className="panel-body">
            <div className="esper-spinner" />
          </div>
        </div>,

        ({exec, prefs}) => <div className="panel panel-default">
          <div className="panel-body">
            <Components.TeamForm ref={(c) => this._form = c}
              name={this.props.team.team_name}
              email={exec.email}
              timezone={prefs.current_timezone}
              groups_only={false}
              showEmail={true}
              editableEmail={false}
              onUpdate={() => this.delayedSave()}
            />
          </div>
          <Components.ModalPanelFooter
            busy={this.props.busy}
            error={this.props.error}
            success={this.state.didSave &&
                     !this.props.busy && !this.props.error}
            onOK={() => this.save()} okText="Save"
          />
        </div>
      );
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
              timezone: d.timezone,
              groups_only: d.groups_only
            });
          }
        });
      }
    }
  }


  /* Sharing -> add/remove team members */

  function SharingSettings({team, profiles}: {
    team: ApiT.Team;
    profiles: ApiT.Profile[];
  }) {
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        { profiles.length ? [
          <div key="info" className="alert alert-info text-center">
            { team.team_executive === Login.myUid() ?
              Text.SelfAssistantsDescription :
              Text.ExecAssistantsDescription
            }
          </div>,
          <div key="list" className="list-group">{ _.map(profiles, (p) =>
            <div key={p.profile_uid} className="list-group-item clearfix">
              <i className="fa fa-fw fa-user" />{" "}
              { p.display_name }
              { p.display_name === p.email ? "" : ` (${p.email})`}
              <span className="pull-right">
                { p.profile_uid === team.team_executive ?
                  <span className="role-box">
                    { Text.RoleExec }
                  </span> :

                  ( p.profile_uid === Login.myUid() ?
                    <span className="role-box">
                      { Text.RoleSelf }
                    </span>  :

                    <a className="action rm-action"
                       title={Text.RemoveAssistant}
                       onClick={() => removeAssistant(team.teamid, p)}>
                      <i className="fa fa-fw fa-close list-group-item-text" />
                    </a> )
                }
              </span>
            </div>
          )}</div>
        ] : null }

        <InviteInput team={team} />
      </div>
    </div>;
  }

  function removeAssistant(teamId: string, p: ApiT.Profile) {
    if (p.profile_uid === Login.myUid()) {
      Route.nav.path(Paths.Manage.newTeam());
    }
    Actions.Assistants.remove(teamId, p.profile_uid);
  }


  /* Interface for adding a team member */

  function InviteInput({team} : {team: ApiT.Team}) {
    return <Components.EmailInput
      label={ team.team_executive === Login.myUid() ?
              Text.SelfInviteAssistant :
              Text.ExecInviteAssistant }
      successMsg={Text.InviteAssistantSuccess}
      onSubmit={(email) => Actions.Assistants.add(team.teamid, email)}
    />
  }
}




