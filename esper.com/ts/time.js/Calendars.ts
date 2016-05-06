/*
  Helpers for getting current calendar
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="../lib/Model.Capped.ts" />
/// <reference path="../lib/Queue2.ts" />
/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="./Esper.ts" />

module Esper.Calendars {
  export interface CalSelection {
    teamId: string;
    calId: string;
  }

  // Store list of calendars by teamId
  export var CalendarListStore =
    new Model.CappedStore<ApiT.GenericCalendar[]>();


  ////////

  export function get(teamId: string, calId: string) {
    var list = CalendarListStore.val(teamId);
    if (list) {
      return _.find(list, (cal) => cal && cal.id === calId);
    }
  }


  ////////

  /*
    Code for adding and removing calendars for Google-based teams (currently
    not an option for Nylas teams that the user doesn't control)
  */
  export function addTeamCalendar(_id: string, cal: ApiT.GenericCalendar) {
    var calendars = _.cloneDeep(CalendarListStore.val(_id) || []);
    calendars.push(_.cloneDeep(cal));
    queueUpdate(_id, calendars);
  }

  export function removeTeamCalendar(_id: string, cal: ApiT.GenericCalendar) {
    var calendars = _.cloneDeep(CalendarListStore.val(_id) || []);
    _.remove(calendars, (c) => c.id === cal.id);
    queueUpdate(_id, calendars);
  }

  // Queues update to server to match calendars on a given team object
  function queueUpdate(_id: string, calendars: ApiT.GenericCalendar[]) {
    var calIds = _.map(calendars, (c) => c.id);
    var p = CalendarUpdateQueue.enqueue(_id, {
      teamId: _id,
      calIds: calIds
    }).then((t) => Option.wrap(t));
    CalendarListStore.push(_id, p, calendars)

    if (_id) {
      Stores.Teams.TeamStore.pushFetch(_id, p,
        Stores.Teams.get(_id).flatMap(
          (team) => {
            var newTeam = _.cloneDeep(team);
            newTeam.team_timestats_calendars = calIds;
            return Option.some(newTeam);
          }
        ));

      /*
        TODO: There is a potential bug here if multiple people are editing
        the calendar list. We should update the CalendarListStore with the
        correct calendars based on the response we get back about the team's
        team_timestats_calendars property.
      */
    }
  }


  interface CalendarUpdate {
    teamId: string;
    calIds: string[];
  }

  var CalendarUpdateQueue = new Queue2.Processor(
    function(update: CalendarUpdate) {
      Analytics.track(Analytics.Trackable.SetTimeStatsCalendars, {
        numCalendars: update.calIds.length,
        teamId: update.teamId,
        calendarIds: update.calIds
      });
      return Api.putTeamTimestatsCalendars(update.teamId, update.calIds);
    },
    function(updates) {
      return [updates[updates.length - 1]];
    });


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

      var calendars = CalendarListStore.val(t.teamid);
      if (calendars && !force) {
        return $.Deferred().resolve().promise();
      }

      // Pre-populate calendar list store with _ids while we're fetching
      calendars = calendars ||
        _.map(t.team_timestats_calendars,
          (calId) => ({ id: calId, title: "" })
        );

      var p = Api.getTimestatsCalendarList(t.teamid);
      CalendarListStore.pushFetch(t.teamid,
        p.then((c) => c.calendars),
        calendars);
      return p;
    });

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
