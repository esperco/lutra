/*
  Client-side time stat calculations
*/

module Esper.EventStats {

  /*
    Wrapper around event with relative weight for an event as well as how we
    should categorize or group this event
  */
  export interface Annotation {
    event: Stores.Events.TeamEvent;

    /*
      Interface itself has no implied unit -- this can be seconds or people-
      hours or anything other value we want to assign to an event. Up to
      code using this interface to determine
    */
    value: number;

    // Heirarchical list of tags to group this event by
    groups: string[];
  }

  /*
    Heirarchal map of grouping strings to annotations
  */
  export interface Grouping {
    [index: string]: {
      annotations: Annotation[];
      total: number; // Sum of all annotation values
      subgroups: Grouping;
    }
  }

  // Convert annotations to grouping
  export function groupAnnotations(annotations: Annotation[]) {
    var grouping: Grouping = {};

    _.each(annotations, (a) => {
      let currentGroup = grouping;
      _.each(a.groups, (g) => {
        currentGroup[g] = currentGroup[g] || {
          annotations: [],
          total: 0,
          subgroups: {}
        };
        currentGroup[g].annotations.push(a);
        currentGroup[g].total += a.value;
        currentGroup = currentGroup[g].subgroups;
      });
    });

    return grouping;
  }

  /*
    Progressive annotation and grouping of a series of events, with emission
    upon end of calculation
  */
  export abstract class Calculation extends Emit.EmitBase {
    events: Stores.Events.TeamEvent[];
    results: Grouping;

    constructor(events: Stores.Events.TeamEvent[]) {
      super();
      this.events = events;
    }




  }
}
