/*
  Module for managing paginated predictions -- i.e. where we show user a
  list of one set of preditios
*/
module Esper.Predictions {

  /*
    Sorts a list of events by priority for prediction confirmation. Also de-
    duplicate recurring event ids (since confirming the same recurring
    event over and over results in low signal gain).
  */
  export function prioritize(events: Stores.Events.TeamEvent[]) {

    // Just filter out recurring for now -- can do more intelligent sorting
    // later
    return _(events)
      .uniqBy((e) => e.recurringEventId || e.id)
      .value()
  }
}
