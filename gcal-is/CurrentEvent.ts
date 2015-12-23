/*
  Watch and respond to current event in Google Calendar
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />
/// <reference path="../marten/ts/Watchable.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="./Gcal.ts" />

module Esper.CurrentEvent {

  // Things to store
  // * FullEventId => Events
  // * taskid => Tasks
  // * task list for current event
  // * Currently selected team
  // * Currently selected fullEvent

  // event Id plus selected team
  interface CurrentSelection extends Types.FullEventId {
    calendarId: string;
    eventId: string;

    /*
      It'd be more consistent to store a teamId and keep the teams separate
      so we could update team data without having refresh other stores, but
      team data rarely changes, so OK to store this in denormalized form.
    */
    team?: ApiT.Team;
  }
  export var currentStore = new Model.StoreOne<CurrentSelection>();

  // Watcher for storing actual event data
  export var eventStore = new Model.CappedStore<ApiT.CalendarEvent>();

  // Watcher for storing task data
  export var taskStore = new Model.CappedStore<ApiT.Task>();

  // Watcher for map between events and tasks
  export var taskEventStore = new Model.BatchStore(taskStore);

  // Get key for eventStore (task is just taskId)
  export function getEventKey(calId: string, eventId: string): string;
  export function getEventKey(
    evt: ApiT.CalendarEvent|ApiT.GenericCalendarEvent|Types.FullEventId
  ): string;
  export function getEventKey(first: any, second?: any): string {
    var calId: string;
    var eventId: string;
    if (second) {
      calId = first;
      eventId = second;
    }

    else {
      var calEvent = <ApiT.CalendarEvent> first;
      var genEvent = <ApiT.GenericCalendarEvent> first;
      var fullEvent = <Types.FullEventId> first;
      if (calEvent.google_cal_id) {
        calId = calEvent.google_cal_id;
        eventId = calEvent.google_event_id;
      } else if (genEvent.calendar_id) {
        calId = genEvent.calendar_id;
        eventId = genEvent.id;
      } else {
        calId = fullEvent.calendarId;
        eventId = fullEvent.eventId;
      }
    }

    return calId + "|" + eventId;
  }

  /*
    Function to set the above stores and watchers when eventId changes.
    We use a separate function to store everything in one go rather than have
    the stores/watchers listen to each other to avoid callback soup.
  */
  export function setEventId(fullEventId: Types.FullEventId) {

    if (fullEventId && fullEventId.eventId) {
      var eventKey = getEventKey(fullEventId);

      // Ensure we have login info before making new calls
      var initPromise = Login.getLoginInfo()

        // Also make sure teams are initialized first (if we don't pass a
        // param, this won't re-run API call if already set or in progress)
        .then(function() {
          return Teams.initialize();
        });

      /*
        Fetch event details and update stores -- event data is fetched
        alongside task data, but parallel fetch event promises in case there
        is no task.
      */
      if (! eventStore.has(eventKey)) {
        var eventPromise = initPromise
          .then(function() {
            var team = guessTeam(fullEventId.calendarId);
            var calId = fullEventId.calendarId;
            var eventId = fullEventId.eventId;
            refreshEvent(team, calId, eventId);
          });
      }

      // Promise to set task and taskEvents
      var tasksPromise: JQueryPromise<ApiT.Task[]>;
      if (! taskEventStore.batchHas(eventKey)) {
        tasksPromise = initPromise
          .then(function() {
            return Api.getTaskListForEvent(fullEventId.eventId, true, false);
          });

        var taskEventPromise = tasksPromise
          .then(function(tasks: ApiT.Task[]) {
            return _.map(tasks, (t) => [t.taskid, t]);
          });
        taskEventStore.batchFetch(eventKey, taskEventPromise);

        // Also update any events tied to tasks
        tasksPromise
          .done(function(tasks: ApiT.Task[]) {
            _.each(tasks, (t) => {
              _.each(t.task_events, (e) => {
                if (e.task_event) {
                  var k = getEventKey(e.task_event);
                  eventStore.upsertSafe(k, e.task_event, {
                    dataStatus: Model.DataStatus.READY
                  });
                }
              });
            });
          });
      }

      /*
        We've already fetched this before, create a fake promise  that resolves
        immediately with the tasks.
      */
      else {
        tasksPromise = $.Deferred<ApiT.Task[]>()
          .resolve(taskEventStore.batchVal(eventKey))
          .promise();
      }

      currentStore.set(fullEventId, {
        dataStatus: Model.DataStatus.FETCHING
      });

      // Promise to set current and guess team
      tasksPromise.then(function(tasks: ApiT.Task[]) {
        var task = tasks && tasks[0];
        var team: ApiT.Team;
        if (task) {
          team = _.find(Login.myTeams(), function(t) {
            return t.teamid === task.task_teamid;
          });
        } else {
          team = guessTeam(fullEventId.calendarId)
        }

        currentStore.set({
          calendarId: fullEventId.calendarId,
          eventId: fullEventId.eventId,
          team: team
        }, {
          dataStatus: Model.DataStatus.READY
        });
      }, function(err) {
        currentStore.set(null, {
          dataStatus: Model.DataStatus.FETCH_ERROR,
          lastError: err
        });
      });
    }

    else {
      currentStore.unset();
    }
  }

  export function refreshEvent(team: ApiT.Team, calId: string, eventId: string)
  {
    var teamId = team.teamid;
    var teamCalendars = team.team_calendars;
    var p = Api.getEventDetails(teamId, calId, teamCalendars, eventId)
      .then(function(evOpt) {
        return evOpt && evOpt.event_opt
      });
    eventStore.fetch(getEventKey(calId, eventId), p);
  }

  /*
    Given a calendarId, pick the most likely Team to be assigned to this task
    given the calendarId. Else pick the first team the user belongs to.
  */
  function guessTeam(calendarId: string): ApiT.Team {
    var ret: ApiT.Team;
    var likelihood = 0;
    _.each(Login.myTeams(), function(team: ApiT.Team) {
      var calendar = _.find(team.team_calendars, function(teamCal) {
        return teamCal.google_cal_id === calendarId;
      });
      if (calendar) {
        var thisLikelihood = 1;
        if (calendar.is_primary) {
          thisLikelihood += 100;
        }
        if (calendar.calendar_default_write) {
          thisLikelihood += 10;
        }
        if (calendar.calendar_default_agenda) {
          thisLikelihood += 1;
        }
        if (calendar.calendar_default_view) {
          thisLikelihood += 1;
        }
        if (thisLikelihood > likelihood) {
          likelihood = thisLikelihood;
          ret = team;
        }
      }
    });
    return ret || Login.myTeams()[0];
  }

  // For when we change team while viewing an event -- we should update task
  // as well.
  export function setTeam(team: ApiT.Team) {
    currentStore.set((data) => <CurrentSelection> _.extend({}, data, {
      team: team
    }));
  }

  // Watch hash change
  var initialized = false;
  export function init() {
    if (! initialized) {

      /*
        Google Calendar's initial hash value isn't a reliable source of
        information and doesn't appear to be used on load by Google, but
        it can confuse our hashchange watcher, so blank it out initially.
      */
      var initHash = "#init"
      location.hash = initHash;

      /*
        Update eventId on location change
      */
      Message.listen(Message.Type.LocationUpdate, function() {
        // Initial hash implies this listener is just being called due to
        // us setting the hash above.
        if (window.location.hash !== initHash) {
          setEventId(Gcal.Event.extractFullEventIdFromHash())
        }
      });

      /*
        Unlike the initial hash, the "eid" param is used by Google to control
        the initial event rendered. If this is set in the URL, use this for
        our initial eventId.
      */
      setEventId(Gcal.Event.extractFullEventIdFromParam());

      initialized = true;
    }
  }
}
