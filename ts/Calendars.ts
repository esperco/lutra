/*
  Helpers for getting current calendar
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/Queue.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />

module Esper.Calendars {
  export interface CalSelection {
    teamId: string;
    calId: string;
    events?: {
      id: string,
      title: string
    }[];
  }

  export var selectStore = new Model.StoreOne<CalSelection>();

  export function get(teamId: string, calId: string) {
    var team = Teams.get(teamId);
    if (team) {
      return _.find(team.team_calendars, (cal) => getId(cal) === calId);
    }
  }

  /*
    Extract ID for calendar -- refactored into function because this may
    change -- i.e. when we bring in Nylas integration, need to use key other
    than google_cal_id.
  */
  export function getId(calOrEvent: ApiT.Calendar|ApiT.CalendarEvent) {
    return calOrEvent.google_cal_id;
  }

  /*
    Same as above, but for events. Include calendar id because no guarantee
    event id isn't reused across different calendars
  */
  export function getEventId(event: ApiT.CalendarEvent) {
    return getId(event) + "|" + event.google_event_id;
  }

  // Returns a default team and calendar selection
  export function defaultSelection() {
    var retTeam: ApiT.Team;
    var retCal: ApiT.Calendar;
    var retScore = 0;
    _.each(Teams.all(), (team) => {
      _.each(team.team_calendars, (cal) => {
        var likelihood = 1;
        if (cal.is_primary) {
          likelihood += 100;
        }
        if (cal.calendar_default_write) {
          likelihood += 10;
        }
        if (cal.calendar_default_agenda) {
          likelihood += 1;
        }
        if (cal.calendar_default_view) {
          likelihood += 1;
        }
        if (likelihood > retScore) {
          retScore = likelihood;
          retTeam = team;
          retCal = cal;
        }
      });
    });

    if (retTeam && retCal) {
      return {
        teamId: retTeam.teamid,
        calId: getId(retCal)
      };
    }
  }

  export function setDefault() {
    if (! selectStore.isSet()) {
      selectStore.set(defaultSelection());
    }
  }

  export function addTeamCalendar(_id: string, cal: ApiT.Calendar) {
    var team = Teams.get(_id);
    if (team) {
      var teamCopy = _.cloneDeep(team); // Store values immutable so clone
      var cal = _.cloneDeep(cal);
      teamCopy.team_calendars = teamCopy.team_calendars || [];
      teamCopy.team_calendars.push(cal);
      cal.calendar_default_view = true;
      cal.calendar_default_write = true;
      cal.calendar_default_agenda = true;
      queueUpdate(_id, teamCopy);
    }
  }

  export function removeTeamCalendar(_id: string, cal: ApiT.Calendar) {
    var team = Teams.get(_id);
    if (team) {
      var teamCopy = _.cloneDeep(team); // Store values immutable so clone
      _.remove(teamCopy.team_calendars,
        (c) => Calendars.getId(c) === getId(cal)
      );

      // Check if we're deselecting current calendar
      var currentSelection = selectStore.val();
      if (currentSelection &&
          currentSelection.teamId === _id &&
          currentSelection.calId === getId(cal))
      {
        selectStore.unset();
      }

      queueUpdate(_id, teamCopy);
    }
  }

  // Queues update to server to match calendars on a given team object
  function queueUpdate(_id: string, team: ApiT.Team) {
    nextUpdates[_id] = team;

    /*
      Prepend team-cal- because we only want to be blocking on team calendar
      updates, not any object with this teamid
    */
    var p = Queue.enqueue("team-cal-" + _id, (t?: ApiT.Team) => {
      var calendars = nextUpdates[_id] && nextUpdates[_id].team_calendars;
      if (calendars) {
        delete nextUpdates[_id];

        var teamId = (team.teamid || (t && t.teamid));
        if (teamId) {
          return Api.putTeamCalendars(_id, calendars);
        } else {
          return Teams.saveTeam(_id, team);
        }
      }

      // Return promise that resolves to current team to avoid pushFetch
      // setting something to null
      var ret = t || Teams.get(_id);
      return $.Deferred<ApiT.Team>().resolve(ret).promise();
    });

    Teams.teamStore.pushFetch(_id, p, team);
  }

  // Track pending calendar updates for team
  var nextUpdates: {
    [index: string]: ApiT.Team
  } = {};
}
