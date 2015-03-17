/** Domain logic for group scheduling. */
module Esper.GroupScheduling {
  export enum Availability {
    yes, no, maybe
  }

  var defaultAvailability = Availability.yes;

  /** All the guests in the group event. */
  export var guests: ApiT.Guest[] = [];

  /** The status of a guest at some specific event. */
  export interface Status {
    guest: ApiT.Guest;
    availability: Availability;
  }

  export interface PossibleTime {
    guests: Status[];
    event: ApiT.CalendarEvent;
  }

  var guestsListeners = [];

  export function onGuestsChanged(listener) {
    guestsListeners.push(listener);
  }

  function guestsChanged() {
    guestsListeners.forEach(function (listener) {
      listener();
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

  export var times: PossibleTime[] = [];

  export function getEventStatus(event: ApiT.CalendarEvent): PossibleTime {
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
      var guestStatuses: Status[] = guests.map(function (guest) {
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

    guestsChanged();
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
    var full = str.match(/(.*)<[^>]*>/);
    if (full) return {
      email        : full[2],
      display_name : full[1].trim()
    };

    if (str.indexOf("@") >= 0) return {
      email : str.trim()
    };

    return {
      email        : "",
      display_name : str.trim()
    };
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

      guestsChanged();
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
                                     availability?: Availability) {
    var time = List.find(times, function (time) {
      return time.event.google_event_id == event.google_event_id;
    });

    if (time) {
      var status = List.find(time.guests, function (status) {
        return status.guest == guest;
      });

      if (status) {
        var newAvailability = availability || nextAvailability(status.availability);
        status.availability = newAvailability;

        timesChanged();
      } else {
        Log.d("Could not find the given guest on the given event.", guest, event);
      }
    } else {
      Log.d("Could not find the event in the group scheduling times list.", event);
    }
  }

  /** Cycles through the possible availabilities in "yes", "no",
   * "maybe".
   */
  export function nextAvailability(current: Availability): Availability {
    return Availability[current + 1] ? current + 1  : Availability.yes;
  }
}