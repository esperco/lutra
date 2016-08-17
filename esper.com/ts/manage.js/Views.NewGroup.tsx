/*
  New Group page
*/

module Esper.Views {
  interface Props {
    isAdmin?: boolean;
  }

  export class NewGroup extends ReactHelpers.Component<Props, {
    busy?: boolean;
  }> {
    _groupForm: Components.NewGroupForm;

    constructor(props: {}) {
      super(props);
      this.state = { busy: false }
    }

    renderWithData() {
      return <div className="team-settings-page esper-full-screen minus-nav">
        <Components.ManageSidebar teams={Stores.Teams.all()}
          groups={Stores.Groups.all()}
          newGroup={true} />

        <div className="esper-content padded">
          <div id="new-group-page" className="esper-expanded">
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
          </div>
        </div>
      </div>;
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
