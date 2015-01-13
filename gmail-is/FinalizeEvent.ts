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

  /** Sets whether the given event is a hold or not. Right now, this
   *  change is accomplished by adding or removing "HOLD: " from the
   *  event title.
   */
  export function setHold(event: ApiT.CalendarEvent, hold: boolean) {
    var edit = {
      google_event_id : event.google_event_id,
      google_cal_id   : event.google_cal_id,
      guests          : [],
      summary         : event.title,
      start           : { dateTime : event.start.utc },
      end             : { dateTime : event.end.utc }
    };

    if (isHold(event) != hold) {
      if (hold) {
        edit.summary = "HOLD: " + edit.summary;
      } else {
        edit.summary = edit.summary.replace(/^HOLD: /, "");
      }

      var teamid = CurrentThread.team.get().teamid;
      var threadId = CurrentThread.threadId.get();
      return Api.updateLinkedEvent(teamid, threadId, event.google_event_id, edit);
    } else {
      return null;
    }
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

    var calls = holds.map(function (hold) {
      var holdId = hold.google_event_id;
      var threadId = CurrentThread.threadId.get();

      return Api.deleteLinkedEvent(team.teamid, threadId, holdId);
    });

    var updateCall = setHold(event, false);
    if (updateCall) calls.push(updateCall);

    Promise.join(calls).done(done);
  }


  /** Returns the text of the message for confirming the given hold,
   *  as well as all non-hold events.
   *
   *  Strips "HOLD: " from all event titles.
   */
  export function confirmMessage(event: ApiT.CalendarEvent): string {
    if (CurrentThread.team.isValid()) {
      var linkedEvents = CurrentThread.linkedEvents.get().map(function (e) {
        return e.event;
      });
      // TODO: Support multiple events properly (again)
      var name  = CurrentThread.team.get().team_name;

      var eventTimezone = CurrentThread.eventTimezone(event);

      var start    = new Date(event.start.local);
      var end      = new Date(event.start.local);
      var range    = XDate.range(start, end);
      var timezone =
        (<any> moment).tz(event.start.local, eventTimezone).zoneAbbr();

      var time = XDate.fullWeekDay(start) + ", " + range + " " + timezone;
      var location = event.location &&
        (event.location.title || event.location.address);

      return [
        "Hi " + name,
        "",
        "You are confirmed for " + event.title +
          " on " + time +
          (location ? " at " + location : "") +
          ". " +
          "Please let me know if you have any questions about this appointment."
      ].join("<br />");
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

    Gmail.scrollToCompose();
  }

  /** Depending on preferences, this provides controls to duplicate or
   *  edit the existing event to invite guests to it.
   */
  export function inviteGuests(event: ApiT.CalendarEvent,
                               preferences: ApiT.Preferences) {
    InviteControls.insertAfterThread(event);
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