/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/Stores.Calendars.ts" />
/// <reference path="./Views.NotificationSettings.tsx" />

module Esper.Actions {

  export function renderNotificationSettings(msg?: string) {
    Stores.Calendars.loadAllCalendars({});
    ApiC.getAllPreferences();

    render(<Views.NotificationSettings message={msg} />);
    Analytics.page(Analytics.Page.NotificationSettings);
  }

}
