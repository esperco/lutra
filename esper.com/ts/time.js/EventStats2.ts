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

  // Convert annotations to grouping -- optionally takes an existing grouping
  // to add to
  export function groupAnnotations(annotations: Annotation[],
                                   grouping?: Grouping) {
    grouping = grouping || {};

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


  /* Settings for Calculation */

  // How many events to annotate or group at any given time
  const DEFAULT_MAX_PROCESS_EVENTS = 10;


  /*
    Asynchronous, non-blocking annotation and grouping of a series of events,
    with emission of change event at end of calculation.
  */
  export abstract class Calculation extends Emit.EmitBase {
    // Are we there yet?
    ready = false;

    // Intermediate state for use with progressive calculation
    eventQueue: Stores.Events.TeamEvent[] = [];
    annotationsQueue: Annotation[] = [];
    grouping: Grouping = {};
    MAX_PROCESS_EVENTS = DEFAULT_MAX_PROCESS_EVENTS;

    // Returns some grouping if done, none if not complete
    getResults(): Option.T<Grouping> {
      return this.ready ?
        Option.wrap(this.grouping) :
        Option.none<Grouping>();
    }

    // Start calulations based on passed events
    start(events: Stores.Events.TeamEvent[]) {
      this.init(events);
      window.requestAnimationFrame(this.runLoop);
    }

    // Pre-populate vars used in processing loop
    init(events: Stores.Events.TeamEvent[]) {
      this.eventQueue = _.clone(events);
      this.ready = false;
      this.annotationsQueue = [];
      this.grouping = {};
    }

    /*
      Recursive "loop" that calls annotateSome and groupSome until we're done.
      Bind to make testing references easier
    */
    runLoop = () => {
      if (! _.isEmpty(this.eventQueue)) {
        this.annotateSome();
        window.requestAnimationFrame(this.runLoop)
        return;
      }

      if (! _.isEmpty(this.annotationsQueue)) {
        this.groupSome();
        window.requestAnimationFrame(this.runLoop)
        return;
      }

      // If we get here, we're done. Emit to signal result.
      this.ready = true;
      this.emitChange();
    }

    // Annotate some events from queue, returns true if it did work, false
    // if queue was empty
    annotateSome() {
      // Get events to process
      var events = this.eventQueue.slice(0, this.MAX_PROCESS_EVENTS);

      // Actual annotations
      _.each(events, (e) => {
        let annotation = this.annotate(e);
        if (_.isArray(annotation)) {
          this.annotationsQueue = this.annotationsQueue.concat(annotation);
        } else {
          this.annotationsQueue.push(annotation);
        }
      });

      // Remove processed items from queue
      this.eventQueue = this.eventQueue.slice(this.MAX_PROCESS_EVENTS);
    }

    groupSome() {
      // Get events to process
      var annotations = this.annotationsQueue.slice(0,
        this.MAX_PROCESS_EVENTS);

      // Do some grouping
      groupAnnotations(annotations, this.grouping);

      // Removed processed items from queue
      this.annotationsQueue = this.annotationsQueue.slice(
        this.MAX_PROCESS_EVENTS);
    }

    // Replace with per-chart annotations
    abstract annotate(event: Stores.Events.TeamEvent): Annotation|Annotation[];
  }
}
