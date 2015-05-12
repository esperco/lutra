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
    Log.d(places);
    return places;
  }
}
