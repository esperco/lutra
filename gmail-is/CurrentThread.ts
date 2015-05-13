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
  export var team = new Esper.Watchable.C<Option.T<ApiT.Team>>(
    function (team) { return team !== undefined && team !== null; },
    Option.none<ApiT.Team>()
  );

  /** Sets the new team. The promise will return the new team once all
   *  the needed updates are done and everything is synchronized.
   *
   *  Events that depend on the team being set correctly should not be
   *  fired until this promise returns. (Isn't asynchronous
   *  programming in JavaScript fun?)
   */
  export function setTeam(newTeam: Option.T<ApiT.Team>) : void {
    team.set(newTeam);

    newTeam.match({
      some : function (newTeam) {
        Menu.currentTeam.set(newTeam);
      },
      none : function () {
        Menu.currentTeam.set(null);
      }
    });
  }

  /** Sets the threadId, making sure to update the team, executive and
   *  task as well.
   */
  export function setThreadId(newThreadId) {
    if (!newThreadId) {
      task.set(null);
      team.set(Option.none<ApiT.Team>());
      GroupScheduling.clear();

      threadId.set(newThreadId);
    } else {
      findTeam(newThreadId).done(function (newTeam) {
        refreshTaskForThread(false, newThreadId).done(function () {
          GroupScheduling.reset();
          setTeam(newTeam);
          threadId.set(newThreadId);
        });
      });
    }
  }

  // Set the thread id when the user navigates around GMail:
  window.onhashchange = function (e) {
    setThreadId(esperGmail.get.email_id());
  };

  // Initialize the threadId when the page is loaded as appropriate:
  $(function () {
    // We try to get the threadId from the URL ourselves because
    // Gmail.js fails until more of the page is loaded.
    var match = window.location.hash.match(/#[^\/]+\/(.+)/);

    if (match && match.length >= 2) {
      setThreadId(match[1]);
    }
  });

  // TODO: Make sure the following listener is acutally unnecessary:
  // esperGmail.on.open_email(function (id, url, body, xhr) {
  //   Log.d("Opened email " + id, url, body);
  //   setThreadId(id);
  // });

  /** The GMail threadId of the current thread. If there is no thread,
   *  this is undefined. You can check if there is an open thread with
   *  `isThreadView()`.
   */
  export var threadId = new Esper.Watchable.C<string>(
    function (threadId) { return threadId && typeof threadId === "string" },
    undefined
  );

  /** Are currently viewing a valid thread? */
  function isThreadView() : boolean {
    return threadId.isValid();
  }

  /** Returns a list of all the people involved in the current
   *  thread. (Includes the exec and assistant if appropriate.)
   *
   *  Returns [] if we can't get the thread data for some reason (ie
   *  gmail js has a problem);
   */
  export function getParticipants() : ApiT.Guest[] {
    var thread = esperGmail.get.email_data();

    if (thread && thread.first_email) {
      return thread.people_involved.map(function (person) {
        return {
          display_name : person[0] || null, // "" treated as no display name
          email        : person[1]
        };
      });
    } else {
      return [];
    }
  }

  /** Fetches the executive's profile for the given team. */
  export function getExecutive(team : ApiT.Team) : ApiT.Profile {
    return Teams.getProfile(team.team_executive);
  }

  /** Gets the executive of the current team, if any. */
  export function getCurrentExecutive() : Option.T<ApiT.Profile> {
    return team.get().flatMap<ApiT.Profile>(function (team) {
      return Option.wrap<ApiT.Profile>(Teams.getProfile(team.team_executive));
    });
  }

    /** Returns whether the current thread has a message from the
     *  current executive. If there is no team, the result is always
     *  false.
     */
  export function hasMessageFromExecutive() : boolean {
    return getCurrentExecutive().match({
      some : function (executive) {
        var emails = executive.other_emails.concat([executive.email]);
        return Thread.hasMessageFrom(esperGmail.get.email_data(), emails);
      },
      none : function () {
        return false;
      }
    });
  }

  /** Returns a list of all the poeple invloved in the current thread
   *  excluding the exec and any assistants.
   *
   *  Returns [] if we can't get the thread data for some reason (ie
   *  gmail js has a problem).
   */
  export function getExternalParticipants() : ApiT.Guest[] {
    return team.get().match({
      some : function (team) {
        var executive = getExecutive(team);
        var all = getParticipants();
        return all.filter(function (participant) {
          return participant.email != executive.email &&
            team.team_email_aliases.indexOf(participant.email) == -1;
        });
      },
      none : function () {
        return [];
      }
    });
  }

  /** All the events linked with the current thread. */
  export var linkedEvents = new Esper.Watchable.C<ApiT.EventWithSyncInfo[]>(
    function () { return true }, // should always be valid!
    []
  );

  var linkedEventsListeners = [];

  /** Add a listener to be notified when the list of linked events
   *  associated with the current thread changes.
   */
  export function onLinkedEventsChanged(listener) {
    linkedEventsListeners.push(listener);
  }

  /** Send out an event that the list of linked events has changed. */
  export function linkedEventsChanged() {
    linkedEventsListeners.forEach(function (listener) {
      listener();
    });
  }

  export function linkEvent(e) {
    team.get().match({
      some : function (team) {
        var teamid = team.teamid;

        Api.linkEventForMe(teamid, threadId.get(), e.google_event_id)
          .done(function() {
            // TODO Report something, handle failure, etc.
            Api.linkEventForTeam(teamid, threadId.get(), e.google_event_id)
              .done(function() {
                refreshTaskForThread(false);
                Api.syncEvent(teamid, threadId.get(),
                              e.google_cal_id, e.google_event_id);

                linkedEventsChanged();
              });
          });
      },
      none : function () {
        window.alert("Could not link event because no team is currently detected.");
      }
    });
  }

  /** The task associated with the current thread, if any. */
  export var task = new Esper.Watchable.C<ApiT.Task>(
    function (task) { return task !== null && task !== undefined },
    null
  );

  // If we have a new task, we should ensure the team is consistent with it:
  task.watch(function (newTask, isValid) {
    if (isValid) {
      setTeam(Option.wrap(List.find(Login.myTeams(), function (team) {
        return team.teamid == newTask.task_teamid;
      })));
    }
  });

  /** Returns the team for the current thread, if any. */
  export function findTeam(threadId): JQueryPromise<Option.T<ApiT.Team>> {
    return team.get().match({
      some : function (team) {
        return Promise.defer(team);
      },
      none : function () {
        return findTeamWithTask(threadId).then(function (team) {
          return team.match({
            some : function (team) {
              return <any> Option.some(team);
            },
            none : function () {
              var emailData = esperGmail.get.email_data();
              return <any> Thread.detectTeam(Login.myTeams(), emailData)
                .then(function (detectedTeam) {
                  return Option.wrap(detectedTeam);
                });
            }
          });
        });
      }
    });
  }


  /** Look for a team that has a task for the given thread. If there
   *  are multiple such teams, return the first one.
   */
  function findTeamWithTask(threadId : string)
    : JQueryPromise<Option.T<ApiT.Task>> {
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

    return findTeam(newThreadId).then(function (team) {
      return team.match({
        some : function (team) {
          var teamid = team.teamid;
          var getTask = forceTask ? Api.obtainTaskForThread : Api.getTaskForThread;

          // cast to <any> needed because promises are implicitly flattened (!)
          return (<any> getTask(teamid, newThreadId, false, true)
                  .then(function(newTask) {
                    task.set(newTask);
                    return newTask;
                  }));
        },
        none : function () {
          Log.i("Could not refresh task because no valid team was detected for the thread.");
          return Promise.defer(null);
        }
      });
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
    team.get().match({
      some : function (team) {
        var prefs = Teams.getTeamPreferences(team);
        callback(prefs);
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
    return team.get().match({
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
}
