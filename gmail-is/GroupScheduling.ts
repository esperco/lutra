/** Domain logic for group scheduling. */
module Esper.GroupScheduling {
  var defaultAvailability = ApiT.Status.yes;

  /** All the guests in the group event. */
  export var guests: ApiT.Guest[] = [];

  var guestsListeners = [];

  /** Listen for changes to the guest list. The listener is passed two
   *  lists: the first of guests added and the second of guests
   *  removed.
   */
  export function onGuestsChanged(listener) {
    guestsListeners.push(listener);
  }

  function guestsChanged(newGuests: ApiT.Guest[], removedGuests: ApiT.Guest[]) {
    guestsListeners.forEach(function (listener) {
      listener(newGuests, removedGuests);
    });
  }

  var timesListeners = [];

  export function onTimesChanged(listener) {
    timesListeners.push(listener);
  }

  function timesChanged() {
    timesListeners.forEach(function (listener) {
      listener();
    });
  }

  export var times: ApiT.PossibleTime[] = [];

  export function getEventStatus(event: ApiT.CalendarEvent): ApiT.PossibleTime {
    return List.find(times, function (time) {
      return time.event.google_event_id == event.google_event_id;
    });
  }

  /** Adds an event to our list of possible times if it isn't in there
   *  already.
   */
  export function addEvent(event: ApiT.CalendarEvent) {
    if (!List.exists(times, function (possible) {
      return possible.event.google_event_id == event.google_event_id;
    })) {
      var guestStatuses: ApiT.GuestStatus[] = guests.map(function (guest) {
        return {
          guest  : guest,
          availability : defaultAvailability
        };
      });

      times.push({
        guests : guestStatuses,
        event  : event
      });
    }
  }

  /** Add a guest to be considered. */
  export function addGuest(guest: ApiT.Guest) {
    guests.push(guest);

    times.forEach(function (time) {
      time.guests.push({
        guest : guest,
        availability : defaultAvailability
      });
    });

    guestsChanged([guest], []);
  }

  /** Populate the guests and times from the server. If the sever has
   *  no data, prefill the guests with participants from the current
   *  thread.
   */
  export function initialize() {
    if (CurrentThread.task.isValid()) {
      var taskid = CurrentThread.task.get().taskid;

      Api.getGroupEvent(taskid).done(function (groupEvent) {
        if (!groupEvent.guests && !groupEvent.times) {
          CurrentThread.getParticipants().forEach(GroupScheduling.addGuest);
          updateServer();
        } else {
          var oldGuests = guests;
          guests = groupEvent.guests;
          guestsChanged(guests, oldGuests);

          groupEvent.times.forEach(function (time) {
            var existing = List.find(times, function (t) {
              return t.event.google_event_id == time.event.google_event_id;
            });

            if (existing) {
              existing.guests = time.guests || [];
            } else {
              times.push(time);
            }
          });
          timesChanged();
        }

        onTimesChanged(updateServer);
        onGuestsChanged(updateServer);
      });

      function updateServer() {
        return Api.putGroupEvent(taskid, { guests : guests, times : times });
      }
    } else {
      Log.d("Tried to initialize group tab with an invalid current task. Retrying in 300ms.");
      setTimeout(initialize, 300);
    }
  }

  /** Returns a string representation of a guest that depends on
   *  whether we have a display name for them.
   */
  export function guestLabel(guest: ApiT.Guest): string {
    return guest.display_name || guest.email;
  }

  /** Parses a guest from a string. There are three possible formats:
   *
   *  "Display Name <email@example.com>"
   *  "email@example.com" (display_name will be undefined—it's an optional field)
   *  "Display Name" (email will be "")
   *
   *  This function tells the latter two cases apart simply by looking
   *  for a "@"; if it finds it, it assumes that it's looking at an
   *  email address.
   */
  export function parseGuest(str: string): ApiT.Guest {
    var full = str.match(/(.*)<([^>]*)>/);
    if (full) return {
      email        : full[2],
      display_name : full[1].trim()
    };

    if (str.indexOf("@") >= 0) return {
      email : str.trim()
    };

    return null;
  }

  /** Remove the given guest. Just uses normal JS equality for now,
   *  which is based on the object's identity.
   *
   *  Chances are this will change to a more intelligent comparison
   *  function in the near future.
   */
  export function removeGuest(guest: ApiT.Guest) {
    var index = List.findIndex(guests, function (guest2) {
      return guest.email        === guest2.email &&
             guest.display_name === guest2.display_name;
    });

    if (index >= 0) {
      guests.splice(index, 1);

      times.forEach(function (time) {
        var index = List.findIndex(time.guests, function (status) {
          return status.guest.email        === guest.email &&
                 status.guest.display_name === guest.display_name;
        });

        if (index >= 0) {
          time.guests.splice(index, 1);
        }
      });

      guestsChanged([], [guest]);
    } else {
      Log.d("Tried to remove a guest that was not in the group:", guest);
    }
  }

  /** Tries to change the availability of the given guest at the given
   *  event. If no new availability is passed in, it will cycle
   *  according to the usual "yes", "no", "maybe" order.
   *
   *  If the given guest or event is not found, it will log an error
   *  and not do anything.
   */
  export function changeAvailability(event: ApiT.CalendarEvent,
                                     guest: ApiT.Guest,
                                     availability?: string) {
    var time = List.find(times, function (time) {
      return time.event.google_event_id == event.google_event_id;
    });

    if (time) {
      var status = List.find(time.guests, function (status) {
        return status.guest == guest;
      });

      if (status) {
        var newAvailability = availability ||
                              ApiT.Status.next(status.availability);
        status.availability = newAvailability;

        timesChanged();
      } else {
        Log.d("Could not find the given guest on the given event.", guest, event);
      }
    } else {
      Log.d("Could not find the event in the group scheduling times list.", event);
    }
  }
}