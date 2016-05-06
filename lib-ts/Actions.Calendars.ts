/*
  Refactored module for actions that create or alter teams
*/

/// <reference path="./Analytics.Web.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Stores.Calendars.ts" />

module Esper.Actions.Calendars {

  /*
    Code for adding and removing calendars for Google-based teams (currently
    not an option for Nylas teams that the user doesn't control)
  */
  export function addTeamCalendar(_id: string, cal: ApiT.GenericCalendar) {
    var calendars = Stores.Calendars.list(_id).match({
      none: () => [],
      some: (cals) => _.cloneDeep(cals)
    });
    calendars.push(_.cloneDeep(cal));
    queueUpdate(_id, calendars);
  }

  export function removeTeamCalendar(_id: string, cal: ApiT.GenericCalendar) {
    var calendars = Stores.Calendars.list(_id).match({
      none: () => [],
      some: (cals) => _.cloneDeep(cals)
    });
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
    Stores.Calendars.ListStore.push(_id, p, Option.wrap(calendars))

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
}
