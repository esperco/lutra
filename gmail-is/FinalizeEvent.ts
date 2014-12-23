/** This module contains all the logic for "finalizing" an event,
 *  which happens when all parties agree to a given time.
 *
 *  Depending on exec preferences, this involves the following steps:
 *    - deleting all other linked events
 *      - this removes all other holds that are not needed any more.
 *      - idea: only remove events starting with "HOLD: "
 *    - removing "HOLD" from the event title
 *    - send a confirmation to the executive
 *    - create a duplicate event for the guests
 *    - send invites to the guests, as appropriate
 *      - EAs do this manually right now
 *    - schedule a reminder for the exec
 *    - schedule reminders for the guests?
 *      - may or may not be added in the future
 *
 *  The UI is designed to guide the EA through the process each time
 *  without forcing. They should be able to do other things and
 *  interact with the thread throughout, so we're avoiding modal
 *  dialogs as much as possible.
 */
module Esper.FinalizeEvent {
  /** Is the event a hold or a real event?
   *
   *  Currently, holds are events with titles starting with "HOLD: ".
   */
  export function isHold(event: ApiT.CalendarEvent) {
    return event.title && /^HOLD: /.test(event.title);
  }

  /** Given a list of events, returns just the ones that are holds.
   *  
   *  The optional except argument takes an event and will also filter
   *  out events with the same id.
   */
  export function justHolds(events: ApiT.CalendarEvent[],
                            except?: ApiT.CalendarEvent) {
    return events.filter(function (event) {
      return (!except || except.google_event_id == event.google_event_id) &&
        isHold(event);
    });
  }

  /** Given a list of events, returns just the ones that are not
   *  holds.
   */
  export function notHolds(events: ApiT.CalendarEvent[]) {
    return events.filter(function (event) {
      return !isHold(event);
    });
  }

  /** Deletes all other holds linked to the same task. If this is a
   *  hold itself, turns it into a real event.
   *
   *  Calls the `done' callback after the delete API calls are done.
   */
  export function deleteHolds(event: ApiT.CalendarEvent, done) {
    var team = CurrentThread.team.get();
    var id = event.google_event_id;

    var linkedEvents = CurrentThread.linkedEvents.get().map(function (e) {
      return e.event;
    });
    var holds = justHolds(linkedEvents).filter(function (other) {
      return other.google_event_id != id;
    });

    var deleteCalls = holds.map(function (hold) {
      var holdId = hold.google_event_id;
      var threadId = CurrentThread.threadId.get();

      return Api.deleteLinkedEvent(team.teamid, threadId, holdId);
    });

    Promise.join(deleteCalls).done(done);
  }


  /** Returns the text of the message for confirming the given hold,
   *  as well as all non-hold events.
   */
  export function confirmMessage(event: ApiT.CalendarEvent): string {
    if (CurrentThread.team.isValid()) {
      var linkedEvents = CurrentThread.linkedEvents.get().map(function (e) {
        return e.event;
      });
      var events = notHolds(linkedEvents).concat([event]);
      var message = "Confirming the following events:<br />";

      return events.reduce(function (message, ev) {
        var title = ev.title || "";
        var location = ev.location || "";
        var locationStr = location !== "" ? " at " + locationStr : "";

        return message + title + locationStr + "<br />";
      }, message);
    } else {
      return null;
    }
  }

  /** If the exec asked for an event confirmation, this opens a
   *  prefilled reply window and scrolls to it.
   */
  export function confirmEvent(event: ApiT.CalendarEvent,
                               preferences: ApiT.Preferences) {
    if (preferences.general.send_exec_confirmation) {
      Gmail.replyToThread(confirmMessage(event));
    }

    Gmail.scrollThread(1);
  }

  /** Depending on preferences, this provides controls to duplicate or
   *  edit the existing event to invite guests to it.
   */
  export function inviteGuests(event: ApiT.CalendarEvent,
                               preferences: ApiT.Preferences) {
    Gmail.threadContainer().after(InviteControls.widget(event));
  }

  /** Executes the whole finalize flow on the given event. */
  export function finalizeEvent(event: ApiT.CalendarEvent) {
    CurrentThread.withPreferences(function (preferences) {
      var team = CurrentThread.team.get();
      var threadId = CurrentThread.threadId.get();
      var taskTab = TaskTab.currentTaskTab;
      var profiles = Sidebar.profiles;

      deleteHolds(event, function () {
        TaskTab.refreshEventLists(team, threadId, taskTab, profiles);
      });

      confirmEvent(event, preferences);
      inviteGuests(event, preferences);
    });
  }
}