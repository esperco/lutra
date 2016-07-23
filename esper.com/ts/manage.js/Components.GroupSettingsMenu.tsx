/*
  A quick menu to switch between different tabs for a given group's settings
*/

module Esper.Components {
  export function GroupSettingsMenu({group, pathFn}: {
    group: ApiT.Group;
    pathFn?: (p: {groupId: string}) => Paths.Path;
  }) {
    var groupId = group.groupid;
    var me = _.find(group.group_individuals,
      (gim) => gim.uid === Login.myUid()
    );

    return <div className="esper-content-header settings-menu fixed padded">
      <SettingsMenuLink groupId={groupId} text={Text.GeneralSettings}
        pathFn={Paths.Manage.Group.general} activePathFn={pathFn} />
      <SettingsMenuLink groupId={groupId} text={Text.Labels}
        pathFn={Paths.Manage.Group.labels} activePathFn={pathFn} />
      { me && me.role !== "Member" ?
        <SettingsMenuLink groupId={groupId} text={Text.NotificationSettings}
          pathFn={Paths.Manage.Group.notifications} activePathFn={pathFn} /> :
        null
      }
    </div>;
  }

  function SettingsMenuLink({groupId, text, pathFn, activePathFn}: {
    groupId: string;
    text: string|JSX.Element;
    pathFn: (p: {groupId: string}) => Paths.Path;
    activePathFn?: (p: {groupId: string}) => Paths.Path;
  }) {
    return <a href={pathFn({groupId: groupId}).href}
              className={classNames("esper-subheader-link", {
                active: activePathFn === pathFn
              })}>
      { text }
    </a>;
  }
}
