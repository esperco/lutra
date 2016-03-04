/// <reference path="./Calendars.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Views.NotificationSettings.tsx" />

module Esper.Actions {

  export function NotificationSettings(msg?: string) {
    Calendars.loadAllCalendars({ force: true });
    return <Views.NotificationSettings message={msg} />;
  }

}
