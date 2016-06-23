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

  export interface OptGrouping {
    some: Grouping;
    none: {
      annotations: Annotation[];
      total: number;
    }
  }

  /*
    Convert annotations to grouping -- optionally takes an existing grouping
    to add to
  */
  export function groupAnnotations(annotations: Annotation[],
                                   grouping?: OptGrouping) {
    grouping = grouping || {
      some: {},
      none: {
        annotations: [],
        total: 0
      }
    };

    _.each(annotations, (a) => {
      if (a.groups.length) {
        let currentGroup = grouping.some;
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
      }
      else {
        grouping.none.annotations.push(a);
        grouping.none.total += a.value;
      }
    });

    return grouping;
  }


  /*
    Calculate durations of events after adjusting for overlapping
  */
  interface DurationWrapper {
    event: Stores.Events.TeamEvent;
    duration: number;
  }

  export function durationWrappers(events: Stores.Events.TeamEvent[],
    opts: DurationOpts = {}): DurationWrapper[]
  {
    // Make sure events are sorted by start date
    events = _.sortBy(events, (e) => moment(e.start).valueOf());

    // Construct initial annotations
    var ret: DurationWrapper[] = _.map(events, (e) => ({
      event: e,
      duration: 0
    }));

    /* Overlap, truncate calculation */

    // Use strings for maps because numbers convert to Array
    var startMap: {[index: string]: DurationWrapper[]} = {};
    var endMap: {[index: string]: DurationWrapper[]} = {};

    // Critical points = start / end points
    var criticalPoints: number[] = [];

    _.each(ret, (e) => {

      // Truncate start
      var event = e.event;
      var startM = moment(event.start);
      if (opts.truncateStart && moment(opts.truncateStart).diff(startM) > 0) {
        startM = moment(opts.truncateStart);
      }
      var start = startM.valueOf();

      // Truncate end
      var endM = moment(event.end);
      if (opts.truncateEnd && moment(opts.truncateEnd).diff(endM) < 0) {
        endM = moment(opts.truncateEnd);
      }
      var end = endM.valueOf();

      // Ignore invalid start/end dates (possible after truncation)
      if (end <= start) { return; }

      // Map critical points to check for overlaps
      var startStr = start.toString();
      var endStr = end.toString();
      startMap[startStr] = startMap[startStr] || [];
      startMap[startStr].push(e);
      endMap[endStr] = endMap[endStr] || [];
      endMap[endStr].push(e);
      criticalPoints.push(start);
      criticalPoints.push(end);
    });

    criticalPoints.sort();
    var criticalPoints = _.sortedUniq(criticalPoints);

    // Stack of active events as we move through time
    var eventStack: DurationWrapper[] = [];

    _.each(criticalPoints, (p, i) => {
      // Add and remove from current stack
      var str = p.toString();
      eventStack = eventStack.concat(startMap[str] || []);
      _.each(endMap[str] || [], (e) => {
        eventStack = _.without(eventStack, e)
      });

      // Add time to each event in the stack
      var next = criticalPoints[i + 1];
      if (next) {
        var incr = ((next - p) / eventStack.length) / 1000;
        _.each(eventStack, (e) => e.duration += incr);
      }
    });

    return ret;
  }


  /////

  /* Settings for Calculation */

  // How many events to annotate or group at any given time
  const DEFAULT_MAX_PROCESS_EVENTS = 10;

  /*
    Asynchronous, non-blocking annotation and grouping of a series of events,
    with emission of change event at end of calculation.
  */
  export abstract class CalculationBase extends Emit.EmitBase {
    // Are we there yet?
    ready = false;
    running = false;

    // Intermediate state for use with progressive calculation
    eventQueue: Stores.Events.TeamEvent[] = [];
    annotationsQueue: Annotation[] = [];
    grouping: OptGrouping = {
      some: {},
      none: {
        annotations: [],
        total: 0
      }
    };
    MAX_PROCESS_EVENTS = DEFAULT_MAX_PROCESS_EVENTS;

    // Returns some grouping if done, none if not complete
    getResults(): Option.T<OptGrouping> {
      return this.ready ?
        Option.wrap(this.grouping) :
        Option.none<OptGrouping>();
    }

    // Start calulations based on passed events
    start(events: Stores.Events.TeamEvent[]) {
      this.init(events);
      this.next();
    }

    stop() {
      this.running = false;
    }

    // Pre-populate vars used in processing loop
    init(events: Stores.Events.TeamEvent[]) {
      this.eventQueue = _.clone(events);
      this.ready = false;
      this.running = true;
      this.annotationsQueue = [];
      this.grouping = {
        some: {},
        none: {
          annotations: [],
          total: 0
        }
      }
    }

    /*
      Recursive "loop" that calls annotateSome and groupSome until we're done.
      Auto-bind so we can easily reference function by name and avoid recursion
      limits
    */
    runLoop = () => {
      if (! this.running) return;

      if (! _.isEmpty(this.eventQueue)) {
        this.annotateSome();
        this.next();
        return;
      }

      if (! _.isEmpty(this.annotationsQueue)) {
        this.groupSome();
        this.next();
        return;
      }

      // If we get here, we're done. Emit to signal result.
      this.ready = true;
      this.running = false;
      this.emitChange();
    }

    next() {
      window.requestAnimationFrame(this.runLoop);
    }

    // Annotate some events from queue
    abstract annotateSome(): void;

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
  }


  /*
    Standard calculation => just process fixed number of events
  */
  export abstract class Calculation extends CalculationBase {
    // Annotate some events from queue
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
      this.eventQueue = this.eventQueue.slice(events.length);
    }

    // Replace with per-chart annotations
    abstract annotate(event: Stores.Events.TeamEvent): Annotation|Annotation[];
  }


  /*
    Variant of calculation for doing duration-based calculations. When looking
    at a single batch of events for duration calc purposes, we need to consider
    any overlapping events as well (since we split time between overlapping
    events).

    MAX_PROCESS_EVENTS in this case is treated as a suggestion, rather than
    a hard rule.
  */
  export abstract class DurationCalculation extends CalculationBase {
    getSomeEvents() {
      var events = this.eventQueue.slice(0, this.MAX_PROCESS_EVENTS);
      let ends = _.map(events, (e) => e.end.getTime());
      let max = _.max(ends);

      var i = this.MAX_PROCESS_EVENTS;
      var next = this.eventQueue[i];
      while (!!next) {
        if (next.start.getTime() < max) {
          events.push(next);
          max = Math.max(max, next.end.getTime());
          i += 1;
          next = this.eventQueue[i];
        }
        else {
          break;
        }
      }

      return events;
    }

    // Annotate some events from queue, returns true if it did work, false
    // if queue was empty
    annotateSome() {
      // Get events to process
      var events = this.getSomeEvents();

      // Get durations
      var durations = durationWrappers(events);

      // Actual annotations
      _.each(durations, (d) => {
        let annotation = this.annotate(d.event, d.duration);
        if (_.isArray(annotation)) {
          this.annotationsQueue = this.annotationsQueue.concat(annotation);
        } else {
          this.annotationsQueue.push(annotation);
        }
      });

      // Remove processed items from queue
      this.eventQueue = this.eventQueue.slice(events.length);
    }

    // Replace with per-chart annotations
    abstract annotate(event: Stores.Events.TeamEvent, duration: number)
      : Annotation|Annotation[];
  }


  /* Misc calculation classes we're using for charts */

  /* Group events by how long they are */
  export class DurationBucketCalc extends DurationCalculation {
    static BUCKETS = [{
      label: "< 30m",
      gte: 0   // Greater than, seconds
    }, {
      label: "30m +",
      gte: 30 * 60
    }, {
      label: "1h +",
      gte: 60 * 60
    }, {
      label: "2h +",
      gte: 2 * 60 * 60
    }, {
      label: "4h +",
      gte: 4 * 60 * 60
    }, {
      label: "8h +",
      gte: 8 * 60 * 60
    }];

    annotate(event: Stores.Events.TeamEvent, duration: number): Annotation {
      var bucket = _.findLast(DurationBucketCalc.BUCKETS,
        (b) => duration >= b.gte
      )

      return {
        event: event,
        value: duration,
        groups: [bucket.label]
      };
    }
  }
}
