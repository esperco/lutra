/** The info and preferences on the currently active thread, if
 *  any. Contains the following relevant information:
 *
 *    - threadId of current thread (or undefined if not on a thread)
 *    - team for the current thread
 *      - preferences info for that team
 *    - linked events
 *    - linked task
 */
module Esper.CurrentThread {

  /** The team that is detected for the current thread. I am not sure
   *  how robust the detection is, however!
   */
  export var team = new Esper.Watchable.C<ApiT.Team>(
    function (team) { return team !== undefined && team !== null; },
    undefined
  );

  var executive = new Esper.Watchable.C<ApiT.Profile>(
    function (exec) { return exec !== undefined && exec !== null; },
    undefined
  );

  export function setTeam(newTeam: ApiT.Team) {
    executive.set(null); // invalid until reloaded via API
    Api.getProfile(newTeam.team_executive, newTeam.teamid).done(function (newExec) {
      executive.set(newExec);
      team.set(newTeam);
      Menu.currentTeam.set(newTeam);
    });
  }

  /** Sets the threadId, making sure to update the team, executive and
   *  task as well.
   */
  export function setThreadId(newThreadId) {
    if (!newThreadId) {
      task.set(null);
      team.set(null);
      GroupScheduling.clear();
    } else {
      findTeam(newThreadId).done(function () {
        refreshTaskForThread(newThreadId).done(function () {
          GroupScheduling.reset();
        });
      });
    }

    threadId.set(newThreadId);
  }

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

  /** Returns a list of all the poeple invloved in the current thread
   *  excluding the exec and any assistants.
   *
   *  Returns [] if we can't get the thread data for some reason (ie
   *  gmail js has a problem).
   */
  export function getExternalParticipants() : ApiT.Guest[] {
    if (team.isValid() && executive.isValid()) {
      var all = getParticipants();
      return all.filter(function (participant) {
        return participant.email != executive.get().email &&
               team.get().team_email_aliases.indexOf(participant.email) == -1;
      });
    } else {
      return [];
    }
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

  export function linkEvent(e, profiles) {
    var teamid = team.get().teamid;

    Api.linkEventForMe(teamid, threadId.get(), e.google_event_id)
      .done(function() {
        // TODO Report something, handle failure, etc.
        Api.linkEventForTeam(teamid, threadId.get(), e.google_event_id)
          .done(function() {
            refreshTaskForThread();
            Api.syncEvent(teamid, threadId.get(),
                          e.google_cal_id, e.google_event_id);

            linkedEventsChanged();
          });
      });
  }

  /** The task associated with the current thread, if any. */
  export var task = new Esper.Watchable.C<ApiT.Task>(
    function (task) { return task !== null && task !== undefined },
    null
  );

  export function findTeam(threadId) {
    return Sidebar.findTeamWithTask(Login.myTeams(), threadId);
  }

  /** If there is no current task, fetches it from the server and
   *  updates the cached value.
   *
   *  Returns the updated task.
   */
  export function refreshTaskForThread(threadId?): JQueryPromise<ApiT.Task> {
    var threadId = threadId || threadId.get();

    return findTeam(threadId).then(function (team) {
      var teamid = team.teamid;

      // cast to <any> needed because promises are implicitly flattened (!)
      return (<any> Api.obtainTaskForThread(teamid, threadId, false, true)
              .then(function(newTask) {
                task.set(newTask);
                return newTask;
              }));
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
    if (team.isValid()) {
      Api.getPreferences(team.get().teamid).done(callback);
    } else {
      Log.d("No team detected. Not calling callback.");
    }
  }

  /** Returns the timezone of the given event. If the event isn't in
   *  one of the current team's calendars, returns undefined.
   */
  export function eventTimezone(ev: ApiT.CalendarEvent): string {
    if (!team.isValid()) return undefined;

    var teamCal =
      List.find(team.get().team_calendars, function(c) {
        return c.google_cal_id === ev.google_cal_id;
    });

    if (teamCal === null) return undefined;

    return teamCal.calendar_timezone;
  }
}
