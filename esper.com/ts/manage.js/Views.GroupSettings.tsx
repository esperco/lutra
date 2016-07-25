/*
  Base class for a group settings view

  Override renderMain funciton
*/

module Esper.Views {
  interface Props {
    groupId: string;
    msg?: string;
    err?: string;
  }

  export abstract class GroupSettings extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {groupId: string}) => Paths.Path;

    renderWithData() {
      var group = Stores.Groups.require(this.props.groupId);
      if (! group) return <span />;

      return <div className="group-settings-page esper-full-screen minus-nav">
        <Components.ManageSidebar
          activeGroupId={this.props.groupId}
          teams={Stores.Teams.all()}
          groups={Stores.Groups.all()}
          pathFn={this.pathFn}
        />

        <div className="esper-right-content padded">
          <Components.GroupSettingsMenu
            group={group}
            pathFn={this.pathFn}
          />

          <div className="esper-expanded">
            {
              this.props.msg ?
              <div className="alert msg alert-info">{ this.props.msg }</div> :
              null
            }
            {
              this.props.err ?
              <div className="alert msg alert-danger">{ this.props.err }</div> :
              null
            }
            { this.renderMain(group) }
          </div>
        </div>
      </div>;
    }

    abstract renderMain(group: ApiT.Group): JSX.Element;
  }
}
