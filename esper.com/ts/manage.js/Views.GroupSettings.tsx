/*
  Base class for a group settings view

  Override renderMain function
*/

module Esper.Views {
  // GroupID required
  interface Props extends Types.SettingsPageProps {
    groupId: string;
  }

  export abstract class GroupSettings
         extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {groupId: string}) => Paths.Path;

    renderWithData() {
      let group = Stores.Groups.require(this.props.groupId);
      if (! group) return <span />;

      let subMenu = <Components.GroupSettingsMenu
        group={group}
        pathFn={this.pathFn}
      />;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        { this.renderMain(group) }
      </Views.Settings>
    }

    abstract renderMain(group: ApiT.Group): JSX.Element;
  }
}
