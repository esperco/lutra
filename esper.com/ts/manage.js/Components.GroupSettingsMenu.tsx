/*
  A quick menu to switch between different tabs for a given group's settings
*/

module Esper.Components {
  export function GroupSettingsMenu({groupId, pathFn}: {
    groupId: string;
    pathFn?: (p: {groupId: string}) => Paths.Path;
  }) {
    return <div className="esper-content-header settings-menu fixed padded">
      <SettingsMenuLink groupId={groupId} text={Text.GeneralSettings}
        pathFn={Paths.Manage.Group.general} activePathFn={pathFn} />
      <SettingsMenuLink groupId={groupId} text={Text.Labels}
        pathFn={Paths.Manage.Group.labels} activePathFn={pathFn} />
      <SettingsMenuLink groupId={groupId} text={Text.NotificationSettings}
        pathFn={Paths.Manage.Group.notifications} activePathFn={pathFn} />
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
