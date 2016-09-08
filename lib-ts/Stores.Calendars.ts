/*
  Helpers for getting current calendar
*/

/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Teams.ts" />

module Esper.Stores.Calendars {
  export interface CalSelection {
    teamId: string;
    calId: string;
  }

  // Store list of *selected* calendars by teamId
  export var ListStore =
    new Model2.Store<string, ApiT.GenericCalendar[]>();

  // Store list of calendars available for each team id -- used primarily
  // in settings page and onboarding
  export var AvailableStore =
    new Model2.Store<string, ApiT.GenericCalendar[]>();

  // Store list of calendars avaiable for currently logged in user -- usedd in
  // suggesting individuals to add to groups
  export var UserStore =
    new Model2.Store<string, ApiT.GenericCalendar[]>();

  const userId = "";

  ////////

  // List calendars for a team
  export function list(teamId: string): Option.T<ApiT.GenericCalendar[]> {
    return ListStore.get(teamId)
      .flatMap((storeData) => storeData.data);
  }

  // Get a single calendar
  export function get(teamId: string, calId: string)
    : Option.T<ApiT.GenericCalendar>
  {
    return list(teamId)
      .flatMap((calList) =>
        Option.wrap(
          _.find(calList, (cal) => cal && cal.id === calId)
        )
      );
  }

  export function listAvailable(teamId: string)
    : Option.T<ApiT.GenericCalendar[]>
  {
    return AvailableStore.get(teamId)
      .flatMap((storeData) => storeData.data);
  }

  export function listAllForUser() : Option.T<ApiT.GenericCalendar[]> {
    return UserStore.get(userId).flatMap((storeData) => storeData.data);
  }

  export function fetchAvailable(teamId: string, force=false) {
    if (force || listAvailable(teamId).isNone()) {
      var apiP = Api.getGenericCalendarList(teamId)
        .then((calList) => Option.wrap(calList.calendars))
      AvailableStore.fetch(teamId, apiP);

      // If no list for this team yet, create one
      if (ListStore.get(teamId).isNone()) {
        ListStore.set(teamId, Option.some([]));
      }
    }
  }

  // Like get, but throw an error if not found
  export function require(teamId: string, calId: string) {
    return get(teamId, calId).unwrap();
  }

  export function byTeamId() {
    var ret: {[index: string]: ApiT.GenericCalendar[]} = {};
    _.each(Teams.allIds(), (_id) => {
      Stores.Calendars.list(_id).match({
        none: () => null,
        some: (list) => ret[_id] = list
      })
    });
    return ret;
  }


  //////

  // Promise for when all calendars have finished loading
  var calendarLoadDfd: JQueryDeferred<any> = $.Deferred();
  export var calendarLoadPromise = calendarLoadDfd.promise();

  export function loadAllCalendars({teams, force=false}: {
    teams?: ApiT.Team[];
    force?: boolean;
  }) {
    teams = teams || Stores.Teams.all();
    var promises = _.map(teams, (t) => {

      var calendarsOpt = list(t.teamid);
      if (calendarsOpt.isSome() && !force) {
        return $.Deferred().resolve().promise();
      }

      // Pre-populate calendar list store with _ids while we're fetching
      var calendars = calendarsOpt.match({
        none: () => _.map(t.team_timestats_calendars,
          (calId) => ({ id: calId, title: "" })
        ),
        some: (c) => c
      });
      var p = Api.getTimestatsCalendarList(t.teamid);

      ListStore.pushFetch(t.teamid,
        p.then((c) => Option.wrap(c.calendars)),
        Option.wrap(calendars));
      return p;
    });

    // Load all calendars for current user so user has option to add them
    if (! Login.data.is_sandbox_user) {
      var p = Api.getGenericCalendarListOfUser().then(
        (r) => Option.wrap(r.calendars));
      UserStore.pushFetch(userId, p);
      promises = _.concat(promises, [p]);
    }

    calendarLoadPromise = $.when.apply($, promises)
      .done(() => calendarLoadDfd.resolve());
  }

  /*
    Initialize calendar list from team data
  */
  export function init() {
    Login.promise.done((info) => loadAllCalendars({teams: info.teams}));
  }
}
