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

  /** The task associated with the current thread, if any. */
  export var task = new Esper.Watchable.C<ApiT.Task>(
    function (task) { return task !== null && task !== undefined },
    null
  );

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

  /** Returns the text of the message for confirming every linked
   * event.
   */
  export function confirmMessage(): string {
    if (team.isValid()) {
      var events = linkedEvents.get();
      var message = "Confirming the following events:<br />";

      return events.reduce(function (message, ev_) {
        var ev = ev_.event;
        var title = ev.title || "";
        var location = ev.location || "";
        var locationStr = location !== "" ? " at " + locationStr : "";

        return message + title + locationStr + "<br />";
      }, message);
    } else {
      return null;
    }
  }
}