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
}