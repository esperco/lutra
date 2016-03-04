/// <reference path="../lib/ApiC.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Views.NotificationSettings.tsx" />

module Esper.Actions {

  export function NotificationSettings(msg?: string) {
    Calendars.loadAllCalendars({});
    ApiC.getAllPreferences();
    return <Views.NotificationSettings message={msg} />;
  }

}
