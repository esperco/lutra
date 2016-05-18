/*
  Component for updating team forms -- NB: can't update e-mail yet
*/

module Esper.Components {
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
    _form: TeamForm;
    _saveId = Util.randomString();

    constructor(props: Props) {
      super(props);
      this.state = {
        didSave: false
      }
    }

    render() {
      return <div className="panel panel-default">
        <div className="panel-heading">
          { Text.TeamInfoHeading }
        </div>
        <div className="panel-body">
          {
            this.props.exec.join(this.props.prefs,
              (exec, prefs) => Option.some({exec: exec, prefs: prefs})
            ).match({
              none: () => <div className="esper-spinner esper-centered" />,
              some: ({exec, prefs}) =>
                <ModalPanel busy={this.props.busy} error={this.props.error}
                    success={this.state.didSave &&
                             !this.props.busy && !this.props.error}
                    onCancel={() => this.save()} cancelText="Save">
                  <TeamForm ref={(c) => this._form = c}
                    name={this.props.team.team_name}
                    email={exec.email}
                    timezone={prefs.current_timezone}
                    showEmail={false}
                    onUpdate={() => this.delayedSave()}
                  />
                </ModalPanel>
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


}
