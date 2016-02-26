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

  export function asTeamCalendar(c: Calendar, teamId?: string): ApiT.Calendar {
    var asCal = <ApiT.Calendar> c;
    var asGen = <ApiT.GenericCalendar> c;

    // Is Google, return as is
    if (asCal.google_cal_id) {
      return asCal;
    }

    // Generic => convert
    else if (asGen) {

      // TeamId => see if calendar is already in team. If so, just use that.
      if (teamId) {
        var team = Teams.get(teamId);
        if (team) {
          var cal = _.find(team.team_calendars,
            (c) => asGeneric(c).id === asGen.id);
          if (cal) return cal;
        }
      }

      // Not in team, convert
      return {
        google_cal_id: asGen.id,
        calendar_title: asGen.title
      };
    }

    // Weird edge case => log
    else {
      Log.e("asTeamCalendar called with blank calendar")
    }
  }


  ////////

  /*
    Code for adding and removing calendars for Google-based teams (currently
    not an option for Nylas teams that the user doesn't control)
  */
  export function addTeamCalendar(_id: string,
                                  cal: ApiT.Calendar|ApiT.GenericCalendar)
  {
    var calendars = _.cloneDeep(CalendarListStore.val(_id) || []);
    calendars.push(asGeneric(_.cloneDeep(cal)));
    queueUpdate(_id, calendars);
  }

  export function removeTeamCalendar(_id: string,
                                     cal: ApiT.Calendar|ApiT.GenericCalendar)
  {
    var calendars = _.cloneDeep(CalendarListStore.val(_id) || []);
    _.remove(calendars, (c) => asGeneric(c).id === asGeneric(cal).id);

    // Check if we're deselecting current calendar
    var currentSelection = SelectStore.val();
    if (currentSelection &&
        currentSelection.teamId === _id &&
        currentSelection.calId === asGeneric(cal).id)
    {
      SelectStore.unset();
    }

    queueUpdate(_id, calendars);
  }

  // Queues update to server to match calendars on a given team object
  function queueUpdate(_id: string, calendars: ApiT.GenericCalendar[]) {
    var teamCalendars = _.map(calendars, (c) => asTeamCalendar(c, _id));

    var p = CalendarUpdateQueue.enqueue(_id, {
      _id: _id,
      calendars: teamCalendars
    });
    CalendarListStore.push(_id, p, calendars);

    // Shouldn't be reliant on team.team_calendars, but just in case,
    // update team as well
    if (_id) {
      var team = _.cloneDeep(Teams.get(_id));
      team.team_calendars = teamCalendars;
      Teams.teamStore.pushFetch(_id, p, team);
    }
  }



  interface CalendarUpdate {
    _id: string; // CalendarListStore _id, not necessarily teamId

    /*
      Although we're using ApiT.Calendar rather than ApiT.GenericCalendar,
      this weirdly works for Nylas too (so long as you're dealing with
      non-deleged calendar access)
    */
    calendars: ApiT.Calendar[]
  }

  var CalendarUpdateQueue = new Queue2.Processor(
    function(update: CalendarUpdate) {
      Analytics.track(Analytics.Trackable.SetTimeStatsCalendars, {
        numCalendars: update.calendars.length,
        teamId: update._id,
        calendarIds: _.map(update.calendars, (c) => asGeneric(c).id)
      });
      return Api.putTeamCalendars(update._id, update.calendars);
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
