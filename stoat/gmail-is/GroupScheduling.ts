/** Domain logic for group scheduling. */
module Esper.GroupScheduling {
  var defaultAvailability = ApiT.Status.maybe;

  /** All the guests in the group event. */
  export var guests: ApiT.Guest[] = [];

  var initializeListeners = [];

  // listener will only be called *once*, then removed
  export function afterInitialize(
    callback: (tpref: ApiT.TaskPreferences) => void
  )
  {
    initializeListeners.push(callback);
  }

  function initialized(tpref: ApiT.TaskPreferences) {
    initializeListeners.forEach(function (listener) {
      listener(tpref);
    });
    initializeListeners = [];
  }

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
      return time.event_id == event.google_event_id;
    });
  }

  /** Adds an event to our list of possible times if it isn't in there
   *  already.
   */
  export function addEvent(event: ApiT.CalendarEvent) {
    if (!List.exists(times, function (possible) {
      return possible.event_id == event.google_event_id;
    })) {
      var guestStatuses: ApiT.GuestStatus[] = guests.map(function (guest) {
        return {
          guest  : guest,
          availability : defaultAvailability
        };
      });

      times.push({
        guests  : guestStatuses,
        event_id : event.google_event_id
      });

      timesChanged();
    }
  }

  /** Add a guest to be considered if they are not already in the
   *  list. If they are, nothing happens.
   */
  export function addGuest(guest: ApiT.Guest) {
    if (!List.exists(guests, function (existing) {
      return existing.email == guest.email;
    })) {
      guests.push(guest);

      times.forEach(function (time) {
        time.guests.push({
          guest : guest,
          availability : defaultAvailability
        });
      });

      guestsChanged([guest], []);
    }
  }

  export function clear() {
    guests   = [];
    times    = [];

    timesListeners      = [];
    guestsListeners     = [];
  }

  export function reset() {
    clear();
    CurrentThread.taskPrefs.done(function(tpref) {
      initialize(tpref);
    });
  }

  /** Populate the guests and times from the server. If the sever has
   *  no data, prefill the guests with participants from the current
   *  thread.
   */
  function initialize(tpref) {
    // XXX: Disabled until we have time to fix group scheduling.
    // CurrentThread.threadId.isValid() && CurrentThread.task.isValid()
    if (false) {
      var task = CurrentThread.task.get();
      var taskid = task.taskid;

      Api.getGroupEvent(taskid).done(function (groupEvent) {
        if (groupEvent.guests.length === 0 && groupEvent.times.length === 0) {
          CurrentThread.getParticipants().done(function(guests) {
            guests.forEach(GroupScheduling.addGuest);
          });
        } else {
          var oldGuests = guests;
          guests = groupEvent.guests;
          guestsChanged(guests, oldGuests);

          groupEvent.times.forEach(function (time) {
            var existing = List.find(times, function (t) {
              return t.event_id == time.event_id;
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

      var throttled = false;

      function updateServer() {
        // XXX: Disabled until we have time to fix group scheduling.
        // !throttled
        if (false) {
          throttled = true;
          setTimeout(function () {
            throttled = false;
            console.info("updating server!");
            Api.putGroupEvent(taskid, { guests : guests, times : times });
          }, 2500);
        }
      }

      initialized(tpref);
    } else {
      // setTimeout(function() { initialize(tpref); }, 300);
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
      return guest.email === guest2.email;
    });

    if (index >= 0) {
      guests.splice(index, 1);

      times.forEach(function (time) {
        var index = List.findIndex(time.guests, function (status) {
          return status.guest.email === guest.email;
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
      return time.event_id == event.google_event_id;
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
