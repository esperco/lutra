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

  // Updates Menu.currentTeam when this one changes.
  // TODO: Consolidate this and Menu.currentTeam?
  team.watch(function (newTeam) {
    Menu.currentTeam.set(newTeam);
  });

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
            CurrentThread.refreshTaskForThread();
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

  /** If there is no current task, fetches it from the server and
   *  updates the cached value.
   *
   *  Returns the updated task.
   */
  export function refreshTaskForThread() {
    var currentTask = task.get();
    var teamid      = team.get().teamid;

    if (!currentTask) {
      return Api.obtainTaskForThread(teamid, threadId.get(), false, true)
        .then(function(newTask) {
          task.set(newTask);
          return newTask;
        });
    } else {
      return Promise.defer(currentTask);
    }
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
