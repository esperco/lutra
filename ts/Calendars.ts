/*
  Helpers for getting current calendar
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />
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

  // Store currently selected calendar
  export var selectStore = new Model.StoreOne<CalSelection>();

  // Store list of calendars by teamId
  export var calendarListStore =
    new Model.CappedStore<ApiT.GenericCalendar[]>();

  export function get(teamId: string, calId: string) {
    var list = calendarListStore.val(teamId);
    if (list) {
      return _.find(list, (cal) => cal && cal.id === calId);
    }
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
        calId: retCal.google_cal_id
      };
    } else {
      var calLists = calendarListStore.getAll();
      if (calLists && calLists[0]) {
        var cal = calLists[0][0][0];
        var meta = calLists[0][1];
        return {
          teamId: meta._id,
          calId: cal.id
        };
      }
    }
  }

  export function setDefault() {
    if (! selectStore.isSet()) {
      selectStore.set(defaultSelection());
    }
  }

  /*
    Code for converting legacy non-generic Google calendar-specific to
    generic calendar interface
  */
  export type Calendar = ApiT.Calendar|ApiT.GenericCalendar;
  export function asGeneric(c: Calendar): ApiT.GenericCalendar {
    var asCal = <ApiT.Calendar> c;
    var asGen = <ApiT.GenericCalendar> c;

    // Is Google, convert
    if (asCal.google_cal_id) {
      return {
        id: asCal.google_cal_id,
        title: asCal.calendar_title

        /*
          We can also return an optional "access_role" parameter, but since
          time stats doesn't care about this right now, leave out
        */
        // access_role: ""
      };
    }

    else if (asGen) {
      return asGen;
    }

    // Weird edge case => log
    else {
      Log.e("asGeneric called with blank calendar")
    }
  }


  /*
    Code for adding and removing calendars for Google-based teams (currently
    not an option for Nylas teams)
  */
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
        (c) => asGeneric(c).id === asGeneric(cal).id
      );

      // Check if we're deselecting current calendar
      var currentSelection = selectStore.val();
      if (currentSelection &&
          currentSelection.teamId === _id &&
          currentSelection.calId === asGeneric(cal).id)
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
        Analytics.track(Analytics.Trackable.SetTimeStatsCalendars, {
          numCalendars: calendars.length,
          teamId: teamId,
          calendarIds: _.map(calendars, (c) => asGeneric(c).id)
        });
        if (teamId) {
          return Api.putTeamCalendars(teamId, calendars);
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
    calendarListStore.push(_id, p, _.map(team.team_calendars, asGeneric));
  }

  // Track pending calendar updates for team
  var nextUpdates: {
    [index: string]: ApiT.Team
  } = {};


  /*
    Initialize calendar list from team data
  */
  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    _.each(loginResponse.teams, function(t) {
      var genCals = _.map(t.team_calendars, asGeneric) || [];
      calendarListStore.upsert(t.teamid, genCals);
    });
  }

  export function init() {
    Login.loginPromise.done(loadFromLoginInfo);
  }
}
