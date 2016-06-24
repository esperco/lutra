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

  export interface EventMap {
    [index: string]: boolean;
  }

  /*
    Heirarchal maps of grouping strings to annotations
  */
  export interface Group {
    annotations: Annotation[];
    totalValue: number;   // Sum of all annotation values
    totalUnique: number;  // Total unique events
    eventMap: EventMap;   /* Map used to quickly test whether event exists
                             in group */
  }

  export interface Subgroup extends Group {
    subgroups: Grouping;
  }

  export interface Grouping {
    [index: string]: Subgroup;
  }

  export interface OptGrouping extends Group {
    some: Grouping;
    none: Group;
  }

  function emptyGroup(): Group {
    return {
      annotations: [],
      totalValue: 0,
      totalUnique: 0,
      eventMap: {}
    }
  }

  function emptySubgroup(): Subgroup {
    return {
      annotations: [],
      totalValue: 0,
      totalUnique: 0,
      subgroups: {},
      eventMap: {}
    }
  }

  function emptyOptGrouping(): OptGrouping {
    return {
      some: {},
      none: emptyGroup(),
      totalValue: 0,
      totalUnique: 0,
      eventMap: {},
      annotations: []
    }
  }


  /*
    Convert annotations to grouping -- optionally takes an existing grouping
    to add to
  */
  export function groupAnnotations(annotations: Annotation[],
                                   grouping?: OptGrouping) {
    grouping = grouping || emptyOptGrouping();

    _.each(annotations, (a) => {
      var eventKey = Stores.Events.strId(a.event);

      if (a.groups.length) {
        let currentGrouping = grouping.some;
        _.each(a.groups, (g) => {
          let currentGroup = currentGrouping[g] =
            currentGrouping[g] || emptySubgroup();
          currentGroup.annotations.push(a);
          currentGroup.totalValue += a.value;

          if (! currentGroup.eventMap[eventKey]) {
            currentGroup.eventMap[eventKey] = true;
            currentGroup.totalUnique += 1;
          }

          currentGrouping = currentGroup.subgroups;
        });
      }
      else {
        grouping.none.annotations.push(a);
        grouping.none.totalValue += a.value;

        if (! grouping.none.eventMap[eventKey]) {
          grouping.none.eventMap[eventKey] = true;
          grouping.none.totalUnique += 1;
        }
      }

      grouping.totalValue += a.value;
      grouping.annotations.push(a);
      if (! grouping.eventMap[eventKey]) {
        grouping.eventMap[eventKey] = true;
        grouping.totalUnique += 1;
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
  export abstract class CalcBase<T> extends Emit.EmitBase {
    // Are we there yet?
    ready = false;
    running = false;

    // Intermediate state for use with progressive calculation
    _eventQueue: Stores.Events.TeamEvent[] = [];
    _results: T;

    MAX_PROCESS_EVENTS = DEFAULT_MAX_PROCESS_EVENTS;

    // Returns some grouping if done, none if not complete
    getResults(): Option.T<T> {
      return this.ready ?
        Option.wrap(this._results) :
        Option.none<T>();
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
      this._eventQueue = _.clone(events);
      this._results = null;
      this.ready = false;
      this.running = true;
    }

    /*
      Recursive "loop" that calls processBatch until we're done. Auto-bind so
      we can easily reference function by name and avoid recursion limits
    */
    runLoop = () => {
      if (! this.running) return;

      if (! _.isEmpty(this._eventQueue)) {
        var events = this.getBatch();

        // Record init length in case filtering or processing changes this
        var initLength = events.length;

        events = _.filter(events, (e) => this.filterEvent(e));
        this._results = this.processBatch(events, this._results);

        // Remove processed items from queue
        this._eventQueue = this._eventQueue.slice(initLength);

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

    // Returns some events from the head of the queue
    getBatch() {
      return this._eventQueue.slice(0, this.MAX_PROCESS_EVENTS);
    }

    // Override as appropriate -- return false for events to ignore
    filterEvent(event: Stores.Events.TeamEvent) {
      return Stores.Events.isActive(event);
    }

    /*
      Handle events from queue -- takes events plus current intermediate
      result state
    */
    abstract processBatch(events: Stores.Events.TeamEvent[],
                          results?: T): T;
  }


  /*
    Variant of calculation for doing duration-based calculations. When looking
    at a single batch of events for duration calc purposes, we need to consider
    any overlapping events as well (since we split time between overlapping
    events).

    MAX_PROCESS_EVENTS in this case is treated as a suggestion, rather than
    a hard rule.
  */
  export abstract class DurationCalc<T> extends CalcBase<T> {
    getBatch() {
      var events = this._eventQueue.slice(0, this.MAX_PROCESS_EVENTS);
      let ends = _.map(events, (e) => e.end.getTime());
      let max = _.max(ends);

      var i = this.MAX_PROCESS_EVENTS;
      var next = this._eventQueue[i];
      while (!!next) {
        if (next.start.getTime() < max) {
          events.push(next);
          max = Math.max(max, next.end.getTime());
          i += 1;
          next = this._eventQueue[i];
        }
        else {
          break;
        }
      }

      return events;
    }

    processBatch(events: Stores.Events.TeamEvent[], results?: T) {
      var durations = durationWrappers(events);
      _.each(durations,
        (d) => results = this.processOne(d.event, d.duration, results)
      );
      return results;
    }

    abstract processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results?: T): T;
  }


  /* Misc calculation classes we're using for charts */

  /* Group events by how long they are */
  export class DurationBucketCalc extends DurationCalc<OptGrouping> {
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

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results?: OptGrouping
    ) {
      var bucket = _.findLast(DurationBucketCalc.BUCKETS,
        (b) => duration >= b.gte
      );

      return groupAnnotations([{
        event: event,
        value: duration,
        groups: [bucket.label]
      }], results);
    }
  }


  // Count unique events by label type
  export interface LabelCalcCount extends OptGrouping {
    unconfirmed: Stores.Events.TeamEvent[];
    unconfirmedCount: number;
  }

  // Count unique events by label
  export class LabelCountCalc extends CalcBase<LabelCalcCount> {
    processBatch(events: Stores.Events.TeamEvent[], results?: LabelCalcCount) {
      _.each(events, (e) => {
        var eventKey = Stores.Events.strId(e);
        var newEvent = !(results && results.eventMap[eventKey]);

        var labelIds = _.map(Option.matchList(e.labelScores), (s) => s.id);
        var annotations = labelIds.length ?
          // Create annotation for each label
          _.map(labelIds, (labelId) => ({
            event: e,
            value: 1,
            groups: [labelId]
          })) :

          // Empty label => no labels
          [{
            event: e,
            value: 1,
            groups: []
          }];

        results = _.extend({
          unconfirmed: [],
          unconfirmedCount: 0
        }, results, groupAnnotations(annotations, results)) as LabelCalcCount;

        if (newEvent && Stores.Events.needsConfirmation(e)) {
          results.unconfirmed.push(e);
          results.unconfirmedCount += 1;
        }
      });

      return results;
    }
  }

  // Count event durations by selected labels
  export class LabelDurationCalc extends DurationCalc<OptGrouping> {
    selections: Params.ListSelectJSON;

    constructor(p: Params.ListSelectJSON) {
      super();
      this.selections = p;
    }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results?: OptGrouping
    ) {
      var labelIds = _.map(Option.matchList(event.labelScores), (s) => s.id);
      var annotations = Params.applyListSelectJSON(labelIds, this.selections)
        .match({
          none: (): Annotation[] => [],
          some: (matchedLabelIds) => matchedLabelIds.length ?

            // Create annotation for each label
            _.map(matchedLabelIds, (labelId) => ({
              event: event,
              value: duration / matchedLabelIds.length, // Split among matching
              groups: [labelId]
            })) :

            // Empty label => no labels
            [{
              event: event,
              value: duration,
              groups: []
            }]
        });

      return groupAnnotations(annotations, results);
    }
  }


  /* Guest-related calculations */

  export class DomainCountCalc extends CalcBase<OptGrouping> {
    processBatch(events: Stores.Events.TeamEvent[], results?: OptGrouping) {
      _.each(events, (e) => {
        var domains = Stores.Events.getGuestDomains(e);
        var annotations = domains.length ?
          // Create annotation for each domains
          _.map(domains, (domain) => ({
            event: e,
            value: 1,
            groups: [domain]
          })) :

          // Empty label => no labels
          [{
            event: e,
            value: 1,
            groups: []
          }];

        results = groupAnnotations(annotations, results);
      });

      return results;
    }
  }

  /*
    Calc for meeting guests, filtered by e-mail. Pass nestByDomain=true to
    the constructor to group by domains first, then drilldown to individual
    e-mails. Else will calc for a flat list.
  */
  export class GuestDurationCalc extends DurationCalc<OptGrouping> {
    selections: Params.ListSelectJSON;
    nestByDomain: boolean;

    constructor(p: Params.ListSelectJSON, nestByDomain=false) {
      super();
      this.selections = p;
      this.nestByDomain = nestByDomain;
    }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results?: OptGrouping
    ) {
      var domains = Stores.Events.getGuestDomains(event);
      var annotations = Params.applyListSelectJSON(domains, this.selections)
        .match({
          none: (): Annotation[] => [],
          some: (matchedDomains) => {
            let emails = Stores.Events.getGuestEmails(event, matchedDomains);
            return matchedDomains.length ?

              /*
                Create annotation for each guest. If no emails, this will be
                empty and nothing will be counted
              */
              _.map(emails, (email) => ({
                event: event,
                value: duration / emails.length, // Split among matching guests
                groups: this.nestByDomain ?
                  [email.split('@')[1], email] : [email]
              })) :

              // No matched domains => no guests
              [{
                event: event,
                value: duration,
                groups: []
              }]
          }
        });

      return groupAnnotations(annotations, results);
    }
  }
}
