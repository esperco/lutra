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
  export function isHold(event) {
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
  export function setHold(event: ApiT.CalendarEvent, prefs: ApiT.Preferences,
                          hold: boolean) {
    var edit: ApiT.CalendarEventEdit = {
      google_event_id : event.google_event_id,
      google_cal_id   : event.google_cal_id,
      start           : event.start,
      end             : event.end,
      title           : event.title,
      description     : event.description,
      location        : event.location,
      all_day         : event.all_day,
      guests          : []
    };

    if (isHold(edit) != hold) {
      if (hold) {
        window.alert(
          "Error: Attempted to set a confirmed event back to a HOLD. " +
          "Please report this issue!"
        );
        return null;
      } else {
        return CurrentThread.team.get().match({
          some : function (team) {
            edit.title = edit.title.replace(/^HOLD: /, "");
            var threadId = CurrentThread.threadId.get();
            return Api.updateLinkedEvent(team.teamid, threadId, edit.google_event_id, edit);
          },
          none : function () {
            window.alert("No current team detected.");
            return null;
          }
        });
      }
    } else {
      return null;
    }
  }

  /** Deletes all other holds linked to the same task. If this is a
   *  hold itself, turns it into a real event.
   *
   *  Calls the `done' callback after the delete API calls are done.
   */
  export function deleteHolds(event: ApiT.CalendarEvent, prefs, done) {
    CurrentThread.team.get().match({
      some : function (team) {
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

        var updateCall = setHold(event, prefs, false);
        if (updateCall) calls.push(updateCall);

        Promise.join(calls).done(done);
      },
      none : function () {
        window.alert("Cannot delete holds because no team is currently detected.");
      }
    });
  }


  /** Returns the text of the message for confirming the given hold,
   *  as well as all non-hold events.
   *
   *  Strips "HOLD: " from all event titles.
   */
  export function confirmMessage(event: ApiT.CalendarEvent): string {
    return CurrentThread.team.get().match({
      some : function (team) {
        var linkedEvents = CurrentThread.linkedEvents.get().map(function (e) {
          return e.event;
        });
        // TODO: Support multiple events properly (again)
        var name  = team.team_name;

        var eventTimezone = CurrentThread.eventTimezone(event);

        var start    = new Date(event.start.local);
        var end      = new Date(event.end.local);
        var range    = XDate.range(start, end);
        var timezone =
          (<any> moment).tz(event.start.local, eventTimezone).zoneAbbr();

        var time = XDate.fullWeekDay(start) + ", " + range + " " + timezone;
        var location = event.location &&
          (event.location.title || event.location.address);

        return [
          "Hi " + name,
          "",
          "You are confirmed for " + event.title.replace(/^HOLD: /, "") +
            " on " + time +
            (location ? " at " + location : "") +
            ". " +
            "Please let me know if you have any questions about this appointment.<br />"
        ].join("<br />");
      }, none : function () {
        return null;
      }
    });
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
    CurrentThread.team.get().match({
      some : function (team) {
        CurrentThread.withPreferences(function (preferences) {
          var threadId = CurrentThread.threadId.get();
          var taskTab = TaskTab.currentTaskTab;

          Api.getEventDetails(team.teamid, event.google_cal_id,
                              team.team_calendars, event.google_event_id)
            .done(function(eventOpt) {
              if (eventOpt.event_opt !== undefined)
                event = eventOpt.event_opt;

              deleteHolds(event, preferences, function () {
                TaskTab.refreshEventLists(team, threadId, taskTab);
              });

              confirmEvent(event, preferences);
              inviteGuests(event, preferences);
            });
        });
      },
      none : function () {
        window.alert("Cannot finalize event because no team is currently detected.");
      }
    });
  }
}
