/*
  New Team page
*/

module Esper.Views {
  interface Props extends Types.SettingsPageProps {}

  export class NewTeam extends ReactHelpers.Component<Props, {
    busy?: boolean;
  }> {
    _teamForm: Components.NewTeamForm;

    constructor(props: Props) {
      super(props);
      this.state = { busy: false }
    }

    renderWithData() {
      return <Views.Settings {...this.props}>
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
      </Views.Settings>;
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
