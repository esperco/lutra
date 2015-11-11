/*
  Helpers for getting current calendar
*/

/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />

module Esper.Calendars {
  export function get(teamId: string, calId: string) {
    var team = Teams.get(teamId);
    if (team) {
      return _.find(team.team_calendars, (cal) => getId(cal) === calId);
    }
  }

  // Extract ID for calendar -- refactored into function because this may
  // change -- i.e. when we bring in Nylas integration, need to use key other
  // than google_cal_id
  export function getId(cal: ApiT.Calendar) {
    return cal.google_cal_id;
  }

  // Same as above, but for events
  export function getEventId(event: ApiT.CalendarEvent) {
    return event.google_event_id;
  }

  // Returns a default team and calendar selection
  export function defaultSelection() {
    var retTeam: ApiT.Team;
    var retCal: ApiT.Calendar;
    var retScore = 0;
    _.each(Teams.all(), (team) => {
      _.each(team.team_calendars, (cal) => {
        var likelihood = 0;
        if (cal.is_primary) {
          retScore = 100;
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
}
