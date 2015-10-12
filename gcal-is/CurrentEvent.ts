/*
  Watch and respond to current event in Google Calendar
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../common/Api.ts" />
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
  export var taskStore = new Model.StoreOne<ApiT.Task|ApiT.NewTask>();

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
          return Api.getTaskListForEvent(fullEventId.eventId, false, false)
            .then(function(tasks): ApiT.Task {
              return tasks && tasks[0];
            });
        })

        // Update current task and team based on event
        .then(function(task) {
          if (task) {
            taskStore.set(task);
            teamStore.set(_.find(Login.myTeams(), function(team) {
              return team.teamid === task.task_teamid;
            }));
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

  /*
    Returns a promise that resolves to the task for the current event.
    Will create task if none exists yet and will fetch from local store if
    already set.
  */
  export function getTask(): JQueryPromise<ApiT.Task> {
    // Check current store, but be sure to check it's actually a task and
    // not a NewTask
    var current = taskStore.val();
    if (current && (<ApiT.Task> current).taskid) {
      return Promise.defer(<ApiT.Task> current);
    }

    /* Else, create/refresh a task */
    return refreshTask();
  }

  /* Refresh existing task and stores; create task if none exists */
  export function refreshTask(): JQueryPromise<ApiT.Task> {
    var ret: JQueryPromise<ApiT.Task>;

    // Check current store, but be sure to check it's actually a task and
    // not a NewTask
    var current = taskStore.val();
    if (current && (<ApiT.Task> current).taskid) {
      // Update status to reflect that we're fetching from server
      taskStore.set(function(oldTask, oldMetadata) {
        return [oldTask, {dataStatus: Model.DataStatus.FETCHING}];
      });

      ret = Api.getTask((<ApiT.Task>current).taskid, false, false);
    }

    else {
      /* Else, create a task */
      var team = teamStore.val();
      var eventId = eventIdStore.val();
      if (team && eventId) {

        /*
          First, create a NewTask object and update our local source of truth
          if none exists. Note that assign a dataStatus of FETCHING rather than
          INFLIGHT because this NewTask object is a default placeholder that
          we're okay with having overriden, not actual data that we want to
          ensure is saved to the server.
        */
        var newTask: ApiT.NewTask = {
          task_title: Gcal.Event.extractEventTitle()
        };
        taskStore.set(function(oldTask, oldMetadata) {
          if (oldTask) {
            // Existing data, don't change
            return [oldTask, oldMetadata];
          }
          return [newTask, { dataStatus: Model.DataStatus.FETCHING }];
        });

        // Send to server and return promise
        ret = Api.obtainTaskForEvent(
          team.teamid,
          eventId.calendarId,
          eventId.eventId,
          newTask,
          false, false);
      }
    }

    // Update stores after fetching
    return ret.then(function(task) {
      updateTaskFromServer(task);
      return task;
    });
  }

  /*
    Updates the currently stored task based on server data. If dataStatus is
    INFLIGHT, will not update an existing Task in store since server fetch may
    not accurately reflet pending local changes. If current task is a NewTask,
    will try to merge NewTask values into task.
  */
  function updateTaskFromServer(task: ApiT.Task) {
    taskStore.set(function(oldTask, oldMetadata) {
      if (oldMetadata &&
          oldMetadata.dataStatus === Model.DataStatus.INFLIGHT) {
        // No taskId => NewTask, try to merge
        if (oldTask && !(<ApiT.Task> oldTask).taskid) {
          return (<ApiT.Task> _.extend(task, oldTask));
        }
      }

      // Not in flight, save normally
      return [task, {
        dataStatus: Model.DataStatus.READY
      }];
    });
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
    teamStore.set(team);

    var currentTask = (<ApiT.Task> taskStore.val());
    if (!currentTask || currentTask.task_teamid !== team.teamid) {
      var fullEventId = eventIdStore.val();
      Api.getTaskListForEvent(fullEventId.eventId, false, false)
        .done(function(tasks) {
          taskStore.set(_.find(tasks, function(task) {
            return task.task_teamid === team.teamid;
          }));
        });
    }
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