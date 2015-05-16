/*
  Application of rules for determining the timezone to use
  in the context of an event for each participant.
*/
module Esper.PrefTimezone {
  export function execTimezone(prefs: ApiT.Preferences,
                               epref: ApiT.EventPreferences) {
    return epref.executive_timezone || prefs.general.current_timezone;
  }

  export function guestTimezone(prefs: ApiT.Preferences,
                                epref: ApiT.EventPreferences) {
    return epref.guest_timezone || prefs.general.current_timezone;
  }

  export function individualGuestTimezone(prefs: ApiT.Preferences,
                                          epref: ApiT.EventPreferences,
                                          guestEmail: string) {
    var gpref = List.find(epref.guest_preferences, function(gpref) {
      return gpref.email === guestEmail;
    });
    if (gpref && gpref.timezone) {
      return gpref.timezone;
    } else {
      return guestTimezone(prefs, epref);
    }
  }
}
