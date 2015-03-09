/** Domain logic for group scheduling. */
module Esper.GroupScheduling {
  export enum Availability {
    none, yes, no, maybe
  }

  export interface Guest {
    name: string;
    availability: Availability;
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