/*
  New Team page
*/

module Esper.Views {

  export class NewTeam extends ReactHelpers.Component<{}, {
    busy?: boolean;
  }> {
    _teamForm: Components.NewTeamForm;

    constructor(props: {}) {
      super(props);
      this.state = { busy: false }
    }

    renderWithData() {
      return <div className="team-settings-page esper-expanded">
        <Components.ManageSidebar teams={Stores.Teams.all()}
          newTeam={true}
          groups={Stores.Groups.all()} />

        <div className="esper-content">
          <div id="new-team-page" className="esper-expanded">
            <div className="panel panel-default">
              <div className="panel-heading">
                { Text.AddTeamHeading }
              </div>
              <div className="panel-body">
                <Components.NewTeamForm supportsExec={true}
                  ref={(c) => this._teamForm = c}
                />
              </div>
              <Components.ModalPanelFooter
                busy={this.state.busy} disableOK={this.state.busy}
                okText="Save" onOK={() => this.save()}
              />
            </div>
          </div>
        </div>
      </div>;
    }

    save() {
      this._teamForm.validate().match({
        none: () => null,
        some: (d) => {
          this.mutateState((s) => s.busy = true)
          Actions.Teams.createExecTeam(d)
            .done((t) => Route.nav.go(Paths.Manage.Team.calendars({
              teamId: t.teamid
            })))
            .fail(() => this.mutateState((s) => s.busy = false))
        }
      });
    }
  }
}
