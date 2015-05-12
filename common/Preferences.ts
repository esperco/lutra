/*
  Cached executive preferences
*/
module Esper.Preferences {
  var preferences: { [teamid: string]: JQueryPromise<ApiT.Preferences> } = {};

  export function get(teamid: string): JQueryPromise<ApiT.Preferences> {
    if (preferences[teamid] === undefined) {
      preferences[teamid] = Api.getPreferences(teamid);
    }
    return preferences[teamid];
  }

  export function getAllPreferences(teams: ApiT.Team[]):
  JQueryPromise<ApiT.Preferences[]> {
    var l = List.map(teams, function(team: ApiT.Team) {
      return get(team.teamid);
    });
    return Promise.join(l);
  }

  // Workplaces and favorites
  export function savedPlaces(prefs: ApiT.Preferences): ApiT.Location[] {
    var places = [];
    List.iter(prefs.workplaces, function(w) { places.push(w.location); });
    var types = prefs.meeting_types;
    if (types.breakfast) places = places.concat(types.breakfast.favorites);
    if (types.brunch) places = places.concat(types.brunch.favorites);
    if (types.lunch) places = places.concat(types.lunch.favorites);
    if (types.coffee) places = places.concat(types.coffee.favorites);
    if (types.dinner) places = places.concat(types.dinner.favorites);
    if (types.drinks) places = places.concat(types.drinks.favorites);
    return places;
  }

  // Phone and video calls
  export function contactInfo(prefs: ApiT.Preferences): string[] {
    var contacts = [];
    var types = prefs.meeting_types;
    if (types.phone_call) {
      var numbers = List.filterMap(types.phone_call.phones, function(p) {
        if (p.share_with_guests) {
          return "Call EXEC at " + p.phone_number + " (" + p.phone_type + ")";
        } else return null;
      });
      contacts = contacts.concat(numbers);
    }
    if (types.video_call) {
      var handles = List.map(types.video_call.accounts, function(a) {
        return "Call EXEC at " + a.video_username + " (" + a.video_type + ")";
      });
      contacts = contacts.concat(handles);
    }
    return contacts;
  }
}
