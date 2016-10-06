module Esper.Types {

  // Used for settings for a specific team, customer, group,e tc.
  export interface SettingsId {
    teamId?: string;
    cusId?: string;
    groupId?: string;
  }

  // Used for settings page related props, mostly in sidebar
  export interface SettingsPageProps extends SettingsId {
    pathFn: (x: {
      teamId?: string,
      cusId?: string,
      groupId?: string
    }) => Paths.Path;
  }
}
