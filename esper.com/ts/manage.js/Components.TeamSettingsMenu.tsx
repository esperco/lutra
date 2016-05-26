/*
  A quick menu to switch between different tabs for a given team's settings
*/

module Esper.Components {
  export function TeamSettingsMenu({teamId, pathFn}: {
    teamId: string;
    pathFn?: (p: {teamId: string}) => Paths.Path;
  }) {
    return <div className="esper-content-header settings-menu fixed padded">
      <SettingsMenuLink teamId={teamId} text={Text.GeneralSettings}
        pathFn={Paths.Manage.Team.general} activePathFn={pathFn} />
      <SettingsMenuLink teamId={teamId} text={Text.Calendars}
        pathFn={Paths.Manage.Team.calendars} activePathFn={pathFn} />
      <SettingsMenuLink teamId={teamId} text={Text.Labels}
        pathFn={Paths.Manage.Team.labels} activePathFn={pathFn} />
      <SettingsMenuLink teamId={teamId} text={Text.NotificationSettings}
        pathFn={Paths.Manage.Team.notifications} activePathFn={pathFn} />
    </div>;
  }

  function SettingsMenuLink({teamId, text, pathFn, activePathFn}: {
    teamId: string;
    text: string|JSX.Element;
    pathFn: (p: {teamId: string}) => Paths.Path;
    activePathFn?: (p: {teamId: string}) => Paths.Path;
  }) {
    return <a href={pathFn({teamId: teamId}).href}
              className={classNames("esper-subheader-link", {
                active: activePathFn === pathFn
              })}>
      { text }
    </a>;
  }
}
