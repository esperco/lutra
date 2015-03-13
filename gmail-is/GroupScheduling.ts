/** Domain logic for group scheduling. */
module Esper.GroupScheduling {
  export enum Availability {
    none, yes, no, maybe
  }

  export interface PossibleTime {
    guests: ApiT.Guest[];
    event: ApiT.CalendarEvent;
  }

  /** All the guests in the group event. */
  export var guests: ApiT.Guest[] = [];

  /** Add a guest to be considered. */
  export function addGuest(guest: ApiT.Guest) {
    guests.push(guest);
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

  /** Cycles through the possible availabilities in "yes", "no",
   * "maybe" order skipping "none".
   */
  export function nextAvailability(current: Availability) {
    var next = current + 1;

    if (next === Availability.none || !next) {
      next = Availability.yes;
    }

    return next;
  }
}