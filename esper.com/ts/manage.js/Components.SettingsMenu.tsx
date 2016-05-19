/*
  A quick menu to switch between different tabs for a given team's settings
*/

module Esper.Components {
  export function SettingsMenu({teamId}: {teamId: string}) {
    return <div className="esper-content-header settings-menu fixed padded">
      <a href={Paths.Manage.general({teamId: teamId}).href}
         className="esper-subheader-link">
        { Text.GeneralSettings }
      </a>
      <a href={Paths.Manage.labels({teamId: teamId}).href}
         className="esper-subheader-link">
        { Text.Labels }
      </a>
      <a href={Paths.Manage.calendars({teamId: teamId}).href}
         className="esper-subheader-link">
        { Text.Calendars }
      </a>
      <a href={Paths.Manage.notifications({teamId: teamId}).href}
         className="esper-subheader-link">
        { Text.NotificationSettings }
      </a>
    </div>;
  }
}
