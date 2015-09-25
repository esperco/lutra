/** The info and preferences on the currently active thread, if
 *  any. Contains the following relevant information:
 *
 *    - threadId of current thread (or undefined if not on a thread)
 *    - team for the current thread
 *      - preferences info for that team
 *      - the executive profile for that team
 *    - linked events
 *    - linked task
 *
 *  The information gets loaded as follows:
 *    - when you go to a new thread, threadId changes
 *      - then it tries to load a task and a team
 *        - if it's successful, onTeamChanged and onTaskChanged events
 *          fire as appropriate
 *      - onThreadId change event fires
 *    - the task and team might not be valid for a given thread
 *      - onTeamChanged fires when the team is chosen manually
 *      - onTaskChanged fires when a task is created manually
 *    - the executive profile and preferences are updated whenever a
 *      team is loaded, before the teamChanged event fires
 *
 *  The goal is to ensure that everything *valid* is *consistent* by
 *  the time any events fire.
 *
 *  It's tricky because either both task and team or just task can be
 *  invalid in an open thread. However, since a task contains a team,
 *  if task is valid then team should always be valid as well
 */
module Esper.CurrentThread {

  /** The team that is detected for the current thread. I am not sure
   *  how robust the detection is, however!
   */
  export var currentTeam = new Esper.Watchable.C<Option.T<ApiT.Team>>(
    function (team) { return team !== undefined && team !== null; },
    Option.none<ApiT.Team>()
  );

  /** The GMail threadId of the current thread. If there is no thread,
   *  this is undefined. You can check if there is an open thread with
   *  `isThreadView()`.
   */
  export var threadId = new Esper.Watchable.C<string>(
    function (threadId) { return threadId && typeof threadId === "string" },
    undefined
  );

  var initialized = false;
  /* One-time initialization. It must be done with login info available. */
  export function init() {
    if (!initialized) {
      initialized = true;
      // Set the thread ID when the user navigates around GMail:
      var oldOnhashchange = window.onhashchange;
      window.onhashchange = function (e) {
        try {
          if (typeof oldOnhashchange === "function") {
            oldOnhashchange.apply(this, arguments);
          }
        }
        finally {
          updateCurrentThreadId();
        }
      };
      updateCurrentThreadId();
    }
  }

  /** Sets the new team.
   */
  export function setTeam(newTeam: Option.T<ApiT.Team>) : void {
    currentTeam.set(newTeam);
  }

  /** Sets the threadId, making sure to update the team, executive and
   *  task as well.
   */
  export function setThreadId(newThreadId: string) {
    if (!newThreadId) {
      threadId.set(newThreadId);
      setTask(null);
      setTeam(Option.none<ApiT.Team>());
      GroupScheduling.clear();
    } else {
      findTeam(newThreadId).done(function (newTeam) {
        if (newThreadId === readThreadId()) {
          setTeam(newTeam);
          refreshTaskForThread(false, newThreadId).always(function () {
            if (newThreadId === readThreadId()) {
              GroupScheduling.reset();
              threadId.set(newThreadId);
            }
          });
        }
      });
    }
  }

  function clearThreadId() {
    setThreadId(null);
  }

  function updateCurrentThreadId() {
    if (Login.loggedIn()) {
      var curThreadId = readThreadId();
      setThreadId(curThreadId);
    }
    else {
      clearThreadId();
    }
  }

  /** Reads the threadId from the current URL hash fragment, if
   *  any. If no threadId is read, returns null.
   *
   *  Sample inputs:
   *    https://mail.google.com/mail/u/0/#inbox/14f66fccbcdd8088
   *    https://mail.google.com/mail/u/0/#label/Baby+Hippos/14f67afc19bfb1d4
   *    https://mail.google.com/mail/u/1/#inbox/14f956ff39adb9c4?compose=new
   */
  function readThreadId() : string {
    // We try to get the threadId from the URL ourselves because
    // Gmail.js fails until most of the page is loaded.
    var match = window.location.hash.match(/#.*\/([0-9a-f]{16})(\?.*)?$/);

    if (match && match.length >= 2) {
      return match[1];
    } else {
      return null;
    }
  }

  /** Are currently viewing a valid thread? */
  function isThreadView() : boolean {
    return threadId.isValid();
  }

  export function peopleInvolved(participants : ApiT.ThreadParticipants):
  ApiT.Guest[] {
    var allMessages = participants.messages;
    function getKey(x : ApiT.Guest) { return x.email; };
    return List.unique(
      List.concat(
        List.map(allMessages, function(msg) {
          return List.concat([msg.from, msg.to, msg.cc, msg.bcc]);
        })
      ), getKey
    );
  }

  /** Returns a list of all the people involved in the current
   *  thread. (Includes the exec and assistant if appropriate.)
   *
   *  Returns [] if we can't get the thread data for some reason (ie
   *  gmail js has a problem);
   */
  export function getParticipants() : JQueryPromise<ApiT.Guest[]> {
    if (threadId.isValid()) {
      var id = threadId.get();
      return Api.getThreadParticipants(id).then(function(response) {
        return peopleInvolved(response);
      });
    } else {
      return Promise.defer([]);
    }
  }

  /** Fetches the executive's profile for the given team. */
  export function getExecutive(team : ApiT.Team) : ApiT.Profile {
    return Teams.getProfile(team.team_executive);
  }

  /** Gets the executive of the current team, if any. */
  export function getCurrentExecutive() : Option.T<ApiT.Profile> {
    return currentTeam.get().flatMap<ApiT.Profile>(function (team) {
      return Option.wrap<ApiT.Profile>(Teams.getProfile(team.team_executive));
    });
  }

  /** Returns whether the current thread has a message from the
   *  current executive. If there is no team, the result is always
   *  false.
   */
  export function hasMessageFromExecutive() : JQueryPromise<boolean> {
    return getCurrentExecutive().match({
      some : function (executive) {
        if (threadId.isValid()) {
          var id = threadId.get();
          var emails = executive.other_emails.concat([executive.email]);
          return Api.getThreadParticipants(id).then(function(participants) {
            return Thread.hasMessageFrom(participants, emails);
          });
        } else {
          return Promise.defer(false);
        }
      },
      none : function () {
        return Promise.defer(false);
      }
    });
  }

  /** Returns a list of all the people involved in the current thread
   *  excluding the exec and any assistants.
   *
   *  Returns [] if we can't get the thread data for some reason (ie
   *  gmail js has a problem).
   */
  export function getExternalParticipants() : JQueryPromise<ApiT.Guest[]> {
    return currentTeam.get().match({
      some : function (team) {
        var executive = getExecutive(team);
        return getParticipants().then(function(all) {
          return all.filter(function (participant) {
            return participant.email != executive.email &&
              team.team_email_aliases.indexOf(participant.email) == -1;
          });
        });
      },
      none : function () {
        return Promise.defer([]);
      }
    });
  }

  /** Signal that the linked events need to be refetched from the server */
  export var linkedEventsChange = new Esper.Watchable.C<void>(
    function () { return true },
    null
  );

  /** All the events linked with the current thread. */
  export var linkedEvents = new Esper.Watchable.C<ApiT.TaskEvent[]>(
    function () { return true }, // should always be valid!
    []
  );

  export function linkEvent(e): JQueryPromise<void> {
    return currentTeam.get().match({
      some : function (team) {
        var teamid = team.teamid;

        return Api.linkEventForMe(teamid, threadId.get(), e.google_event_id)
          .then(function() {
            // TODO Report something, handle failure, etc.
            Api.linkEventForTeam(teamid, threadId.get(), e.google_event_id)
              .done(function() {
                refreshTaskForThread(false);
                Api.syncEvent(teamid, threadId.get(),
                              e.google_cal_id, e.google_event_id);
              });
          });
      },
      none : function () {
        window.alert("Could not link event because no team is currently detected.");
        return Promise.defer(null);
      }
    });
  }

  /** The task associated with the current thread, if any. */
  export var task = new Esper.Watchable.C<ApiT.Task>(
    function (task) { return task !== null && task !== undefined },
    null
  );

  /** Sets the task and updates the currently stored linked events. If
   *  the given task is null, linkedEvents is set to [].
   */
  export function setTask(newTask : ApiT.Task) {
    task.set(newTask);

    if (newTask) {
      linkedEventsChange.set(null);
    }
  }

  /** We cache the event preferences here until the current task changes.
      Initialized during preInit */
  export var taskPrefs: JQueryPromise<Option.T<ApiT.TaskPreferences>>;

  /** Returns the team for the current thread, if any. */
  export function findTeam(threadId): JQueryPromise<Option.T<ApiT.Team>> {
    return findTeamWithTask(threadId).then(function (team) {
      return team.match({
        some : function (team) {
          Log.i("Found team from findTeamWithTask: " + team.team_name);
          return <any> Promise.defer(Option.some(team));
        },
        none : function () {
          return Thread.detectTeam(Login.myTeams(), threadId)
            .then(function (detectedTeam) {
              if (detectedTeam) {
                Log.i("Guessed team with Thread.detectTeam: " +
                      detectedTeam.team.team_name);
              } else {
                Log.i("Failed to guess team with Thread.detectTeam. (" +
                      detectedTeam + ")");
              }

              return <any> Option.wrap(detectedTeam && detectedTeam.team);
            });
        }
      });
    });
  }

  /** Look for a team that has a task for the given thread. If there
   *  are multiple such teams, return the first one.
   */
  function findTeamWithTask(threadId : string)
    : JQueryPromise<Option.T<ApiT.Team>> {
      return Api.getTaskListForThread(threadId, false, false).then(function(tasks) {
        var hasTask = tasks.length > 0;

        if (hasTask) {
          var task = tasks[0];
          return Option.some(List.find(Login.myTeams(), function(team) {
            return team.teamid === task.task_teamid;
          }));
        } else {
          return Option.none();
        }
      });
    }

  /** Returns a promise that resolves to the task for the current team/thread
   *  and creates that task if necessary
   */
  export function getTaskForThread(): JQueryPromise<ApiT.Task> {
    var taskObj = task.get();
    if (taskObj) {
      return Promise.defer(taskObj);
    } else {
      return refreshTaskForThread(true);
    }
  }

  /** If there is no current task, fetches it from the server and
   *  updates the cached value, as long as there is a valid team.
   *
   *  If there is no valid team, returns null and nothing happens.
   *
   *  If forceTask is true, a task is created when none exists.
   *
   *  Returns the updated task or null if there is no valid team.
   */
  export function refreshTaskForThread(forceTask: boolean,
                                       newThreadId?: string):
  JQueryPromise<ApiT.Task> {
    var newThreadId = newThreadId || threadId.get();
    TaskTab.showTaskSpinner();

    return currentTeam.get().match({
      some : function (team) {
        var teamid = team.teamid;
        var getTask = forceTask ? Api.obtainTaskForThread : Api.getTaskForThread;

        // cast to <any> needed because promises are implicitly flattened (!)
        return (<any> getTask(teamid, newThreadId, false, true)

                // Ensure task actually exists, else return Promise failure
                .then(function(newTask) {
                  if (! newTask) {
                    return Promise.fail(null);
                  }
                  setTask(newTask);
                  return newTask;
                })

                .always(function() {
                  TaskTab.hideTaskSpinner();
                }));
      },
      none : function () {
        Log.i("Could not refresh task because no valid team was detected for the thread.");
        return Promise.fail(null);
      }
    });
  }

  /** Does the current thread have a valid task attached to it? */
  export function hasTask() : boolean {
    return isThreadView() && task.isValid();
  }

  /** Runs the given callback with the preferences of the current
   *  team. If there is no current team, the callback is not executed.
   */
  export function withPreferences(callback) {
    currentTeam.get().match({
      some : function (team) {
        Preferences.get(team.teamid).done(function (prefs) {
          callback(prefs);
        });
      },
      none : function () {
        alert("Cannot get preferences because no team currently detected.");
        Log.e("No team detected. Not calling callback.");
      }
    });
  }

  /** Returns the timezone of the given event. If the event isn't in
   *  one of the current team's calendars, returns null.
   */
  export function eventTimezone(ev: ApiT.CalendarEvent): string {
    return currentTeam.get().match({
      some : function (team) {
        var teamCal =
          List.find(team.team_calendars, function(c) {
            return c.google_cal_id === ev.google_cal_id;
          });

        if (teamCal === null) return null;

        return teamCal.calendar_timezone;
      },
      none : function () {
        return null;
      }
    });
  }

  export interface TeamAndPreferences {
    team : ApiT.Team,
    execPrefs : ApiT.Preferences,
    taskPrefs : Option.T<ApiT.TaskPreferences>
  }

  // Combines Preferences with CurrentThread.currentTeam/taskPrefs
  export function getTeamAndPreferences():
    JQueryPromise<Option.T<TeamAndPreferences>>
  {
    return currentTeam.get().match({
      some: function(team) {
        // Cast due to promise flattening, argh
        return <any> Preferences.get(team.teamid).then(function(execPrefs) {
          return taskPrefs.then(function(prefOpt) {
            return Option.some({
              team: team,
              execPrefs: execPrefs,
              taskPrefs: prefOpt
            });
          });
        });
      },
      none: function() { return Promise.defer(Option.none()); }
    });
  }

  // Set up watchers -- can be done before login info is available
  export function preInit() {

    // If we have a new task, we should ensure the team is consistent with it:
    task.watch(function (newTask, isValid) {
      if (isValid) {
        setTeam(Option.wrap(List.find(Login.myTeams(), function (team) {
          return team.teamid == newTask.task_teamid;
        })));
      }
    });

    /** We cache the event preferences here until the current task changes */
    var noTaskPrefs = Promise.defer(Option.none());
    taskPrefs = noTaskPrefs;

    task.watch(function(newTask, isValid) {
      if (isValid) {
        var wrap = function(e) {
          return Option.wrap<ApiT.TaskPreferences>(e);
        };
        taskPrefs = TaskPreferences.get(newTask.taskid).then(wrap);
      } else {
        taskPrefs = noTaskPrefs;
      }
    });
  }
}
