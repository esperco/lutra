/*
  New Group page
*/

module Esper.Views {
  interface Props extends Types.SettingsPageProps {
    isAdmin?: boolean;
  }

  export class NewGroup extends ReactHelpers.Component<Props, {
    busy?: boolean;
  }> {
    _groupForm: Components.NewGroupForm;

    constructor(props: Props) {
      super(props);
      this.state = { busy: false }
    }

    renderWithData() {
      return <Views.Settings {...this.props}>
        <div className="panel panel-default">
          <div className="panel-heading">
            { Text.AddGroupHeading }
          </div>
          <div className="panel-body">
            <div className="alert alert-info text-center">
              { Text.GroupDescription }
            </div>
            <Components.NewGroupForm isAdmin={this.props.isAdmin}
              ref={(c) => this._groupForm = c}
              teams={Stores.Teams.all()}
              userCalendars={Stores.Calendars.listAllForUser()}
              onSubmit={() => this.save()}
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
      this._groupForm.validate().match({
        none: () => null,
        some: (d) => {
          this.mutateState((s) => s.busy = true)
          Actions.Groups.createGroup(d)
            .done((g) => Route.nav.go(Paths.Manage.Group.general({
              groupId: g.groupid
            })))
            .fail(() => this.mutateState((s) => s.busy = false))
        }
      });
    }
  }
}
