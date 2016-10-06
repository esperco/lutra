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

      let me = _.find(group.group_individuals,
        (gim) => gim.uid === Login.myUid()
      );

      let subMenu = <Components.SettingsMenu>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Group.general}>
          { Text.GeneralSettings }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Group.labels}>
          { Text.Labels }
        </Components.SettingsMenuLink>
        { me && me.role !== "Member" ?
          <Components.SettingsMenuLink {...this.props}
              href={Paths.Manage.Group.notifications}>
            { Text.NotificationSettings }
          </Components.SettingsMenuLink> : null }
      </Components.SettingsMenu>;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        { this.renderMain(group) }
      </Views.Settings>
    }

    abstract renderMain(group: ApiT.Group): JSX.Element;
  }
}
