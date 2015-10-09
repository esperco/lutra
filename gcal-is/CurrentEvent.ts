/*
  Watch and respond to current event in Google Calendar
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/Types.ts" />
/// <refernece path="../common/Watchable.ts" />
/// <reference path="./Gcal.ts" />

module Esper.CurrentEvent {

  // Watcher for reference to current event
  export var eventIdStore = new Model.StoreOne<Types.FullEventId>();

  // Watcher for reference to currently selected team
  export var teamStore = new Model.StoreOne<ApiT.Team>();

  // Watcher for reference to current task (set via currentTeam and eventId)
  export var taskStore = new Model.StoreOne<ApiT.Task>();

  /*
    Function to set the above stores and watchers when eventId changes.
    We use a separate function to store everything in one go rather than have
    the stores/watchers listen to each other to avoid callback soup.
  */
  export function setEventId(fullEventId: Types.FullEventId) {
    eventIdStore.set(fullEventId);

    if (fullEventId && fullEventId.eventId) {
      // Ensure we have login info before making new calls
      Login.getLoginInfo()

        // Also make sure teams are initialized first (if we don't pass a
        // param, this won't re-run API call if already set or in progress)
        .then(function() {
          return Teams.initialize();
        })

        // Fetch task for this event
        .then(function() {
          // TODO: Update task based on eventId once we have the API calls for
          // it
          return Promise.defer<ApiT.Task>(null);
        })

        // Update current task and team based on event
        .then(function(task) {
          if (task) {
            setTask(task);
          }

          // If no task for event, infer current team from calendar Id
          else {
            taskStore.unset();
            teamStore.set(guessTeam(fullEventId.calendarId));
          }
        });
    }
  }

  export function getEventId() {
    return eventIdStore.val();
  }

  /* Set the current task, updates the currentTeam if necessary */
  export function setTask(newTask?: ApiT.Task) {
    taskStore.set(newTask);
    if (newTask) {
      teamStore.set(_.find(Login.myTeams(), function(team) {
        return team.teamid === newTask.task_teamid;
      }));
    }
  }

  export function getTask(): ApiT.Task {
    return taskStore.val();
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
  // as well
  export function setTeam(team: ApiT.Team) {
    teamStore.set(team);

    // TODO: Update task based on team once we have API
    Promise.defer<ApiT.Task>(null)
      .done(function(task) {
        taskStore.set(task);
      });
  }

  export function getTeam(): ApiT.Team {
    return teamStore.val();
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