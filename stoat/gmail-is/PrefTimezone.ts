/*
  Application of rules for determining the timezone to use
  in the context of an event for each participant.
*/
module Esper.PrefTimezone {
  export function execTimezone(prefs: ApiT.Preferences,
                               tpref: ApiT.TaskPreferences) {
    return tpref.executive_timezone || prefs.general.current_timezone;
  }

  export function guestTimezone(prefs: ApiT.Preferences,
                                tpref: ApiT.TaskPreferences) {
    return tpref.guest_timezone || prefs.general.current_timezone;
  }

  export function individualGuestTimezone(prefs: ApiT.Preferences,
                                          tpref: ApiT.TaskPreferences,
                                          guestEmail: string) {
    var gpref = List.find(tpref.guest_preferences, function(gpref) {
      return gpref.email === guestEmail;
    });
    if (gpref && gpref.timezone) {
      return gpref.timezone;
    } else {
      return guestTimezone(prefs, tpref);
    }
  }
}
