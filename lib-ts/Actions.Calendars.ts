/*
  Refactored module for actions that create or alter teams
*/

/// <reference path="./Analytics.Web.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Stores.Calendars.ts" />
/// <reference path="./Stores.Teams.ts" />

module Esper.Actions.Calendars {

  // Helper function that clones a list of calendars for update purposes
  function cloneCalList(teamId: string) {
    return Stores.Calendars.list(teamId)
      .mapOr([], (cals) => _.cloneDeep(cals));
  }

  /*
    Code for adding and removing calendars for Google-based teams (currently
    not an option for Nylas teams that the user doesn't control)
  */
  export function add(teamId: string, cal: ApiT.GenericCalendar) {
    var calendars = cloneCalList(teamId);
    calendars.push(_.cloneDeep(cal));
    return update(teamId, calendars);
  }

  export function remove(teamId: string, cal: ApiT.GenericCalendar) {
    var calendars = cloneCalList(teamId);
    _.remove(calendars, (c) => c.id === cal.id);
    return update(teamId, calendars);
  }

  export function update(teamId: string, cals: ApiT.GenericCalendar[]) {
    return queueUpdate(teamId, cals);
  }

  // Used with Onboarding skip
  export function setDefaultCalendars() {
    let teams = Stores.Teams.all();
    teams = _.filter(teams, (t) => _.isEmpty(t.team_timestats_calendars));

    let promises = _.map(teams, (t) => setDefaultCalForTeam(t));
    return Util.when(promises);
  }

  export function setDefaultCalForTeam(team: ApiT.Team) {
    return Stores.Calendars.fetchAvailable(team.teamid).then(() => {
      let email = team.team_api.team_exec_email;
      let cals = Stores.Calendars.listAvailable(team.teamid).unwrapOr([]);
      let cal = _.find(cals, (c) => c.id === email) || cals[0];

      return cal ?
        update(team.teamid, [cal]).then(() => null) :
        $.Deferred<void>().resolve().promise();
    });
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

    return p;
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
