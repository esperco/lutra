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
  export var team = new Esper.Watchable.C<ApiT.Team>(
    function (team) { return team !== undefined && team !== null; },
    undefined
  );

  export var threadId new Esper.Watchable.C<string>(
    function (threadId) { threadId && typeof threadId === "string" },
    undefined
  );

  /** Are currently viewing a valid thread? */
  function isThreadView() {
    return threadId.isValid();
  }

  // Updates Menu.currentTeam when this one changes.
  // TODO: Consolidate this and Menu.currentTeam?
  team.watch(function (newTeam) {
    Menu.currentTeam.set(newTeam);
  });
}