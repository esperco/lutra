/*
  New Team page
*/

module Esper.Views {
  interface Props extends Types.SettingsPageProps {}

  export class NewTeam extends ReactHelpers.Component<Props, {
    execError: boolean;
    busy: boolean;
  }> {
    _teamForm: Components.NewTeamForm;

    constructor(props: Props) {
      super(props);
      this.state = { busy: false, execError: false }
    }

    renderWithData() {
      return <Views.Settings {...this.props}>
        <div className="panel panel-default">
          <div className="panel-heading">
            { Text.AddTeamHeading }
          </div>
          <div className="panel-body">
            { this.state.execError ?
              <Components.ErrorMsg msg={Text.ExecHasTeamErr} /> : null }
            <Components.NewTeamForm supportsExec={true}
              ref={(c) => this._teamForm = c}
            />
          </div>
          <Components.ModalPanelFooter
            busy={this.state.busy} disableOK={this.state.busy}
            okText="Save" onOK={() => this.save()}
          />
        </div>
      </Views.Settings>;
    }

    save() {
      this._teamForm.validate().match({
        none: () => null,
        some: (d) => {
          this.mutateState((s) => {
            s.busy = true;
            s.execError = false;
          });
          Actions.Teams.createExecTeam(d)
            .done((t) => {
              // Refresh customer object associated with team
              Stores.Customers.refresh();

              // Don't go to payment (shutdown, go to calendar page instead)
              // Route.nav.go(Paths.Manage.Team.pay({
              //   teamId: t.teamid
              // }));

              Route.nav.go(Paths.Manage.Team.calendars({
                teamId: t.teamid
              }));
            })
            .fail((err) => this.mutateState((s) => {
              s.busy = false;
              if (err.errorDetails ===
                  "Cannot_create_new_team_for_executive") {
                err.handled = true;
                s.execError = true;
              }
            }));
        }
      });
    }
  }
}
