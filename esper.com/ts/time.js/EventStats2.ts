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

  /*
    Collection of annotated events for a given date
  */
  export interface DateGroup extends Group {
    date: Date;
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

  function emptyDateGroup(date: Date): DateGroup {
    var group = emptyGroup();
    return {
      date: date,
      annotations: group.annotations,
      totalValue: group.totalValue,
      totalUnique: group.totalUnique,
      eventMap: group.eventMap
    };
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
    running = true;

    // Intermediate state for use with progressive calculation
    _results: T;

    MAX_PROCESS_EVENTS = DEFAULT_MAX_PROCESS_EVENTS;

    constructor() {
      super();
      this._results = this.initResult();
      this.ready = false;
      this.running = false;
    }

    // Returns some grouping if done, none if not complete
    getResults(): Option.T<T> {
      return this.ready ?
        Option.some(this._results) :
        Option.none<T>();
    }


    // Start calulations based on passed events
    start() {
      this.running = true;
      this.next();
    }

    stop() {
      this.running = false;
    }

    /*
      Recursive "loop" that calls processBatch until we're done. Auto-bind so
      we can easily reference function by name and avoid recursion limits
    */
    runLoop = () => {
      if (! this.running) return;

      this.getBatch().match({
        some: (events) => {
          events = _.filter(events, (e) => this.filterEvent(e));
          this._results = this.processBatch(events, this._results);
          this.next();
        },

        none: () => {
          // No more events, we're done. Emit to signal result.
          this.ready = true;
          this.running = false;
          this.emitChange();
        }
      });
    }

    next() {
      window.requestAnimationFrame(this.runLoop);
    }

    onceChange(fn: (result: T) => void) {
      super.once(this.CHANGE_EVENT, () => fn(this._results));
    }

    // Override as appropriate -- return false for events to ignore
    filterEvent(event: Stores.Events.TeamEvent) {
      return Stores.Events.isActive(event);
    }

    // Empty initial result object
    abstract initResult(): T;

    // Get next set of events to process
    abstract getBatch(): Option.T<Stores.Events.TeamEvent[]>;

    /*
      Handle events from queue -- takes events plus current intermediate
      result state
    */
    abstract processBatch(events: Stores.Events.TeamEvent[],
                          results: T): T;
  }


  /*
    Calc which processes a list of events
  */
  export abstract class EventListCalc<T> extends CalcBase<T> {
    _eventQueue: Stores.Events.TeamEvent[] = [];

    constructor(events: Stores.Events.TeamEvent[]) {
      super();
      this._eventQueue = _.clone(events);
    }

    // Returns some events from the head of the queue
    getBatch() {
      if (_.isEmpty(this._eventQueue)) {
        return Option.none<Stores.Events.TeamEvent[]>();
      }

      var events = this._eventQueue.slice(0, this.MAX_PROCESS_EVENTS);
      this._eventQueue = this._eventQueue.slice(events.length);
      return Option.some(events);
    }
  }


  /*
    Calc which processes durations for a list of events, truncated by day
  */
  export abstract class DateDurationCalc extends CalcBase<DateGroup[]>
  {
    _eventDates: Stores.Events.EventsForDate[];
    _date: Date;

    constructor(eventDates: Stores.Events.EventsForDate[]) {
      super();
      this._eventDates = _.cloneDeep(eventDates);
    }

    initResult(): DateGroup[] {
      return [];
    }

    getBatch(): Option.T<Stores.Events.TeamEvent[]> {
      if (_.isEmpty(this._eventDates)) {
        return Option.none<Stores.Events.TeamEvent[]>();
      }

      else {
        // Slice off dates until we land on a non-empty date
        var eventDate = this._eventDates[0];
        if (_.isEmpty(eventDate.events)) {
          this._eventDates = this._eventDates.slice(1);
          return this.getBatch();
        }

        this._date = eventDate.date;
        var events = eventDate.events.slice(0, this.MAX_PROCESS_EVENTS);
        eventDate.events = eventDate.events.slice(events.length);

        // Include overlapping
        let ends = _.map(events, (e) => e.end.getTime());
        let max = _.max(ends);
        while (!_.isEmpty(eventDate.events)) {
          let next = eventDate.events[0];
          if (next.start.getTime() < max) {
            max = Math.max(max, next.end.getTime());
            events.push(next);
            eventDate.events = eventDate.events.slice(1);
          } else {
            break;
          }
        }

        return Option.some(events);
      }
    }

    processBatch(events: Stores.Events.TeamEvent[], results: DateGroup[]) {
      var durations = durationWrappers(events, {
        truncateStart: moment(this._date).clone().startOf('day').toDate(),
        truncateEnd: moment(this._date).clone().endOf('day').toDate()
      });
      var dateGroup = _.last(results);
      if (!(dateGroup && dateGroup.date === this._date)) {
        dateGroup = emptyDateGroup(this._date);
        results.push(dateGroup);
      }

      _.each(durations,
        (d) => {
          var eventKey = Stores.Events.strId(d.event);
          if (! dateGroup.eventMap[eventKey]) {
            dateGroup.eventMap[eventKey] = true;
            this.getGroups(d.event, d.duration).match({
              none: () => null,
              some: (groups) => {
                dateGroup.annotations.push({
                  event: d.event,
                  value: d.duration,
                  groups: groups
                });
                dateGroup.totalUnique += 1;
                dateGroup.totalValue += d.duration;
              }
            });
          }
        }
      );

      return results;
    }

    abstract getGroups(event: Stores.Events.TeamEvent,
                       duration: number): Option.T<string[]>;
  }


  /*
    Variant of calculation for doing duration-based calculations. When looking
    at a single batch of events for duration calc purposes, we need to consider
    any overlapping events as well (since we split time between overlapping
    events).

    MAX_PROCESS_EVENTS in this case is treated as a suggestion, rather than
    a hard rule.
  */
  export abstract class DurationCalc<T> extends EventListCalc<T> {
    getBatch() {
      return super.getBatch().flatMap((events) => {
        let ends = _.map(events, (e) => e.end.getTime());
        let max = _.max(ends);

        while (!_.isEmpty(this._eventQueue)) {
          let next = this._eventQueue[0];
          if (next.start.getTime() < max) {
            max = Math.max(max, next.end.getTime());
            events.push(next);
            this._eventQueue = this._eventQueue.slice(1);
          } else {
            break;
          }
        }
        return Option.some(events);
      });
    }

    processBatch(events: Stores.Events.TeamEvent[], results: T) {
      var durations = durationWrappers(events);
      _.each(durations,
        (d) => results = this.processOne(d.event, d.duration, results)
      );
      return results;
    }

    abstract processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: T): T;
  }


  /* Misc calculation classes we're using for charts */

  /* Group events by how long they are */
  export class DurationBucketCalc extends DurationCalc<OptGrouping> {
    static BUCKETS = [{
      label: "< 30m",
      gte: 0,   // Greater than, seconds
      color: Colors.level0
    }, {
      label: "30m +",
      gte: 30 * 60,
      color: Colors.level1
    }, {
      label: "1h +",
      gte: 60 * 60,
      color: Colors.level2
    }, {
      label: "2h +",
      gte: 2 * 60 * 60,
      color: Colors.level3
    }, {
      label: "4h +",
      gte: 4 * 60 * 60,
      color: Colors.level4
    }, {
      label: "8h +",
      gte: 8 * 60 * 60,
      color: Colors.level5
    }];

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
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

  export class DateDurationBucketCalc extends DateDurationCalc {
    getGroups(event: Stores.Events.TeamEvent, duration: number) {
      var bucket = _.findLast(DurationBucketCalc.BUCKETS,
        (b) => duration >= b.gte
      );
      return Option.some([bucket.label]);
    }
  }


  // Count unique events by label type
  export interface LabelCalcCount extends OptGrouping {
    unconfirmed: Stores.Events.TeamEvent[];
    unconfirmedCount: number;
  }

  // Count unique events by label
  export class LabelCountCalc extends EventListCalc<LabelCalcCount> {
    initResult() {
      return _.extend({
        unconfirmed: [],
        unconfirmedCount: 0
      }, emptyOptGrouping()) as LabelCalcCount;
    }

    processBatch(events: Stores.Events.TeamEvent[], results: LabelCalcCount) {
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

    constructor(events: Stores.Events.TeamEvent[],
                p: Params.ListSelectJSON) {
      super(events);
      this.selections = p;
    }

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
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

  export class LabelDurationByDateCalc extends DateDurationCalc {
    selections: Params.ListSelectJSON;

    constructor(eventDates: Stores.Events.EventsForDate[],
                p: Params.ListSelectJSON) {
      super(eventDates);
      this.selections = p;
    }

    getGroups(event: Stores.Events.TeamEvent) {
      var labelIds = _.map(Option.matchList(event.labelScores), (s) => s.id);
      return Params.applyListSelectJSON(labelIds, this.selections);
    }
  }


  /* Guest-related calculations */

  export class DomainCountCalc extends EventListCalc<OptGrouping> {
    initResult() { return emptyOptGrouping(); }

    processBatch(events: Stores.Events.TeamEvent[], results: OptGrouping) {
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

    constructor(events: Stores.Events.TeamEvent[],
                p: Params.ListSelectJSON,
                nestByDomain=false) {
      super(events);
      this.selections = p;
      this.nestByDomain = nestByDomain;
    }

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
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

  export class DomainDurationByDateCalc extends DateDurationCalc {
    selections: Params.ListSelectJSON;

    constructor(eventDates: Stores.Events.EventsForDate[],
                p: Params.ListSelectJSON) {
      super(eventDates);
      this.selections = p;
    }

    getGroups(event: Stores.Events.TeamEvent) {
      var domains = Stores.Events.getGuestDomains(event);
      return Params.applyListSelectJSON(domains, this.selections);
    }
  }
}
