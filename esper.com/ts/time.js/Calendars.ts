/*
  Helpers for getting current calendar
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="../lib/Model.Capped.ts" />
/// <reference path="../lib/Queue2.ts" />
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
  export var SelectStore = new Model.StoreOne<CalSelection>();

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
      var calLists = CalendarListStore.getAll();
      var pair = _.find(calLists, (p) => {
        var calList = p[0];
        return !!calList[0];
      });
      if (pair) {
        var cal = pair[0][0];
        var meta = pair[1];
        return {
          teamId: meta._id,
          calId: cal.id
        };
      }
    }
  }

  export function setDefault() {
    if (! SelectStore.isSet()) {
      SelectStore.set(defaultSelection());
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

    // Check if we're deselecting current calendar
    var currentSelection = SelectStore.val();
    if (currentSelection &&
        currentSelection.teamId === _id &&
        currentSelection.calId === cal.id)
    {
      SelectStore.unset();
    }

    queueUpdate(_id, calendars);
  }

  // Queues update to server to match calendars on a given team object
  function queueUpdate(_id: string, calendars: ApiT.GenericCalendar[]) {
    var calIds = _.map(calendars, (c) => c.id);
    var p = CalendarUpdateQueue.enqueue(_id, {
      teamId: _id,
      calIds: calIds
    });
    CalendarListStore.push(_id, p, calendars);

    if (_id) {
      var team = _.cloneDeep(Teams.get(_id));
      team.team_timestats_calendars = calIds;
      Teams.teamStore.pushFetch(_id, p, team);

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
  export var calendarLoadPromise: JQueryPromise<void>;

  /*
    Initialize calendar list from team data
  */
  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    var promises = _.map(loginResponse.teams, (t) => {

      // Pre-populate calendar list store with _ids while we're fetching
      var calendars = _.map(t.team_timestats_calendars,
        (calId) => ({ id: calId, title: "" })
      );
      CalendarListStore.upsert(t.teamid, calendars, {
        dataStatus: Model.DataStatus.FETCHING
      });

      var p = Api.getGenericCalendarList(t.teamid);
      p.done((c) => CalendarListStore.upsert(t.teamid, c.calendars));
      return p;
    });
    calendarLoadPromise = $.when.apply($, promises);
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
