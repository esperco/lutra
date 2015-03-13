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

  var statusListeners = [];

  export function onStatusChanged(listener) {
    statusListeners.push(listener);
  }

  function statusChanged() {
    statusListeners.forEach(function (listener) {
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
  }

  /** Returns a string representation of a guest that depends on
   *  whether we have a display name for them.
   */
  export function guestLabel(guest: ApiT.Guest): string {
    return guest.display_name || guest.email;
  }

  /** Remove the given guest. Just uses normal JS equality for now,
   *  which is based on the object's identity.
   *
   *  Chances are this will change to a more intelligent comparison
   *  function in the near future.
   */
  export function removeGuest(guest: ApiT.Guest) {
    var index  = guests.indexOf(guest);

    if (index >= 0) {
      guests.slice(index, 1);
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

        statusChanged();
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