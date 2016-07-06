/*
  Client-side time stat calculations
*/

module Esper.EventStats {

  export interface DurationOpts {
    // Truncate duration if start is before this date/time
    truncateStart?: Date;

    // Truncate duration if end is after this date/time
    truncateEnd?: Date;
  }

  // Simple aggregate duration of events, avoids double-counting overlaps
  export function aggregateDuration(events: Stores.Events.TeamEvent[]) {
    var agg = 0;
    var lastEnd: number;

    events = _.sortBy(events, (e) => moment(e.start).unix());
    _.each(events, (e) => {
      var start = moment(e.start).unix();
      var end = moment(e.end).unix();

      start = (lastEnd && lastEnd > start) ? lastEnd : start;
      var duration = end - start;
      if (duration > 0) {
        agg += duration;
        lastEnd = end;
      }
    });

    return agg;
  }


  /////

  /*
    Time stat durations are normally seconds. This normalizes to hours and
    rounds to nearest .05 hour -- rounding may be slightly off because of
    floating point arithmetic but that should be OK in most cases.
  */
  export function toHours(seconds: number) {
    return Number((Math.round((seconds / 3600) / 0.05) * 0.05).toFixed(2));
  }


  /////

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

  export interface CalcOpts { // Standard calc opts for all charts
    filterStr: string;
  }
  export interface LabelOpts extends CalcOpts {
    labels: Params.ListSelectJSON;
  }
  export interface DomainOpts extends CalcOpts {
    domains: Params.ListSelectJSON;
  }
  export interface DomainNestOpts extends DomainOpts {
    nestByDomain: boolean; // Used to nest domain => email in duration calc
  }
  export interface RatingOpts extends CalcOpts {
    showNone: boolean;
  }

  // How many events to annotate or group at any given time
  const DEFAULT_MAX_PROCESS_EVENTS = 10;

  /*
    Asynchronous, non-blocking annotation and grouping of a series of events,
    with emission of change event at end of calculation.
  */
  export abstract class CalcBase<T, U> extends Emit.EmitBase {
    // Are we there yet?
    ready = false;
    running = true;

    // Intermediate state for use with progressive calculation
    _results: T;
    _events: Stores.Events.TeamEvent[] = [];
    _opts: U & CalcOpts;

    MAX_PROCESS_EVENTS = DEFAULT_MAX_PROCESS_EVENTS;

    constructor(events: Stores.Events.TeamEvent[], opts: U & CalcOpts) {
      super();
      this._results = this.initResult();
      this.ready = false;
      this.running = false;
      this._events = events;
      this._opts = opts;
    }

    // Returns some grouping if done, none if not complete
    getResults(): Option.T<T> {
      return this.ready ?
        Option.some(this._results) :
        Option.none<T>();
    }

    /*
      Compare two Calcs to see if they would yield the equivalent results
      without actually having to run the calculations. This can be done
      by seeing if the event lists are essentially equivalent and if
      the opts are identical.
    */
    eq(other: CalcBase<T,U>) {
      return other &&
        other.constructor === this.constructor &&
        _.isEqual(other._opts, this._opts) &&
        this.eqList(other._events, this._events);
    }

    protected eqList(other: Stores.Events.TeamEvent[],
                     this_: Stores.Events.TeamEvent[]) {
      return Stores.Events.eqList(other, this_);
    }

    // Start calulations based on passed events
    start() {
      this.running = true;
      this.next();
    }

    stop() {
      this.running = false;
    }

    /* Start-stop based on presence of listeners */

    // Register a callback to handle changes
    addChangeListener(callback: (...args: any[]) => void): void {
      super.addChangeListener(callback);
      if (! this.running) this.start();
    }

    // De-register a callback to handle changes
    removeChangeListener(callback: (...args: any[]) => void): void {
      super.removeChangeListener(callback);
      if (! this.changeListeners().length) {
        this.stop();
      }
    }

    // Remove all callbacks
    removeAllChangeListeners(): void {
      super.removeAllChangeListeners();
      this.stop();
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
      return Stores.Events.isActive(event) && (
        this._opts.filterStr ?
          Stores.Events.filterOne(event, this._opts.filterStr) : true
      );
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
  export abstract class EventListCalc<T, U > extends CalcBase<T, U> {
    _index = 0;

    // Returns some events from the head of the queue
    getBatch() {
      if (this._index >= this._events.length) {
        return Option.none<Stores.Events.TeamEvent[]>();
      }

      var events = this._events.slice(
        this._index,
        this._index + this.MAX_PROCESS_EVENTS);
      this._index += events.length;
      return Option.some(events);
    }
  }


  /*
    Calc which processes durations for a list of events, truncated by day
  */
  export abstract class DateDurationCalc<U> extends CalcBase<DateGroup[], U>
  {
    _eventDates: Stores.Events.EventsForDate[];
    _dateIndex = 0;
    _eventIndex = 0;
    _date: Date;

    constructor(eventDates: Stores.Events.EventsForDate[],
                opts?: U & CalcOpts) {
      super(
        _.flatten( _.map(eventDates, (d) => d.events) ),
        opts
      );
      this._eventDates = eventDates;
    }

    initResult(): DateGroup[] {
      return [];
    }

    /*
      Checks if two date calcs are equal. Check dates are equal.
    */
    eq(other: DateDurationCalc<U>): boolean {
      return super.eq(other) &&
        _.isEqual(
          _.map(other._eventDates, (d) => d.date.getTime()),
          _.map(this._eventDates, (d) => d.date.getTime()));
    }

    // Ignore label confirmation
    protected eqList(other: Stores.Events.TeamEvent[],
                     this_: Stores.Events.TeamEvent[]) {
      return Stores.Events.eqList(other, this_, {
        deepCompare: true,
        ignoreLabelScores: true
      });
    }

    getBatch(): Option.T<Stores.Events.TeamEvent[]> {
      if (this._dateIndex >= this._eventDates.length) {
        return Option.none<Stores.Events.TeamEvent[]>();
      }

      else {
        // Move index until we land on a non-empty date
        var eventDate = this._eventDates[this._dateIndex];
        if (this._eventIndex >= eventDate.events.length) {
          this._eventIndex = 0;
          this._dateIndex += 1;
          return this.getBatch();
        }

        this._date = eventDate.date;
        var events = eventDate.events.slice(
          this._eventIndex,
          this._eventIndex + this.MAX_PROCESS_EVENTS);
        this._eventIndex += events.length;

        // Include overlapping
        let ends = _.map(events, (e) => e.end.getTime());
        let max = _.max(ends);
        while (this._eventIndex < eventDate.events.length) {
          let next = eventDate.events[this._eventIndex];
          if (next.start.getTime() < max) {
            max = Math.max(max, next.end.getTime());
            events.push(next);
            this._eventIndex += 1;
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
  export abstract class DurationCalc<T, U> extends EventListCalc<T, U> {
    // Ignore label confirmation for duration calc
    protected eqList(other: Stores.Events.TeamEvent[],
                     this_: Stores.Events.TeamEvent[]) {
      return Stores.Events.eqList(other, this_, {
        deepCompare: true,
        ignoreLabelScores: true
      });
    }

    getBatch() {
      return super.getBatch().flatMap((events) => {
        let ends = _.map(events, (e) => e.end.getTime());
        let max = _.max(ends);

        while (this._index < this._events.length) {
          let next = this._events[this._index];
          if (next.start.getTime() < max) {
            max = Math.max(max, next.end.getTime());
            events.push(next);
            this._index += 1;
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
  export class DurationBucketCalc extends DurationCalc<OptGrouping, {}> {
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

  export class DateDurationBucketCalc extends DateDurationCalc<{}> {
    getGroups(event: Stores.Events.TeamEvent, duration: number) {
      var bucket = _.findLast(DurationBucketCalc.BUCKETS,
        (b) => duration >= b.gte
      );
      return Option.some([bucket.label]);
    }
  }


  /* Calc for sorting events by calendar */

  export class CalendarDurationCalc extends DurationCalc<OptGrouping, {}> {
    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
    ) {
      return groupAnnotations([{
        event: event,
        value: duration,
        groups: [event.calendarId]
      }], results);
    }
  }

  export class CalendarDateDurationCalc extends DateDurationCalc<{}> {
    getGroups(event: Stores.Events.TeamEvent) {
      return Option.some([event.calendarId]);
    }
  }


  // Count unique events by label type
  export interface LabelCalcCount extends OptGrouping {
    unconfirmed: Stores.Events.TeamEvent[];
    unconfirmedCount: number;
  }

  // Count unique events by label
  export class LabelCountCalc extends EventListCalc<LabelCalcCount, {}> {
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
  export class LabelDurationCalc
      extends DurationCalc<OptGrouping, LabelOpts> {
    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
    ) {
      var labelIds = _.map(Option.matchList(event.labelScores), (s) => s.id);
      var annotations = Params.applyListSelectJSON(labelIds, this._opts.labels)
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

  export class LabelDurationByDateCalc extends DateDurationCalc<LabelOpts> {
    getGroups(event: Stores.Events.TeamEvent) {
      var labelIds = _.map(Option.matchList(event.labelScores), (s) => s.id);
      return Params.applyListSelectJSON(labelIds, this._opts.labels);
    }
  }


  /* Guest-related calculations */

  export class DomainCountCalc extends EventListCalc<OptGrouping, {}> {
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
  export class GuestDurationCalc
      extends DurationCalc<OptGrouping, DomainNestOpts> {

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
    ) {
      var domains = Stores.Events.getGuestDomains(event);
      var annotations = Params.applyListSelectJSON(domains,
                                                   this._opts.domains)
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
                groups: this._opts.nestByDomain ?
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

  export class DomainDurationByDateCalc
      extends DateDurationCalc<DomainOpts> {

    getGroups(event: Stores.Events.TeamEvent) {
      var domains = Stores.Events.getGuestDomains(event);
      return Params.applyListSelectJSON(domains, this._opts.domains);
    }
  }


  /* Group meetings by how many guests there are */

  export class GuestCountDurationCalc
      extends DurationCalc<OptGrouping, DomainOpts> {
    static BUCKETS = [{
      label: "2 " + Text.Guests,
      gte: 2,   // Greater than, guests
      color: Colors.level1
    }, {
      label: "3 - 4 " + Text.Guests,
      gte: 3,
      color: Colors.level2
    }, {
      label: "5 - 8 " + Text.Guests,
      gte: 5,
      color: Colors.level3
    }, {
      label: "9 - 18" + Text.Guests,
      gte: 9,
      color: Colors.level4
    }, {
      label: "19+ " + Text.Guests,
      gte: 19,
      color: Colors.level5
    }];

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
    ) {
      var domains = Stores.Events.getGuestDomains(event);
      var annotations = Params.applyListSelectJSON(domains, this._opts.domains)
        .match({
          none: (): Annotation[] => [],
          some: (matchedDomains) => {
            let emails = Stores.Events.getGuestEmails(event, matchedDomains);

            // No matched domains => no guests
            if (! matchedDomains.length) {
              return [{
                event: event,
                value: duration,
                groups: []
              }];
            }

            // No emails -> don't count, we've filtered these folks out
            if (! emails.length) {
              return [];
            }

            // Else - count is number of matching guests
            var count = emails.length + 1; // +1 for exec
            var bucket = _.findLast(GuestCountDurationCalc.BUCKETS,
              (b) => count >= b.gte
            );
            return [{
              event: event,
              value: duration,
              groups: [bucket.label]
            }];
          }
        });

      return groupAnnotations(annotations, results);
    }
  }

  export class GuestCountDurationByDateCalc
      extends DateDurationCalc<DomainOpts> {

    getGroups(event: Stores.Events.TeamEvent, duration: number) {
      var domains = Stores.Events.getGuestDomains(event);
      return Params.applyListSelectJSON(domains, this._opts.domains)
        .flatMap((matchedDomains): Option.T<string[]> => {
          let emails = Stores.Events.getGuestEmails(event, matchedDomains);

          // No matched domains => no guests
          if (! matchedDomains.length) {
            return Option.some([]);
          }

          // No emails -> don't count, we've filtered these folks out
          if (! emails.length) {
            return Option.none<string[]>();
          }

          // Else - count is number of matching guests
          var count = emails.length + 1; // +1 for exec
          var bucket = _.findLast(GuestCountDurationCalc.BUCKETS,
            (b) => count >= b.gte
          );
          return Option.some([bucket.label]);
        });
    }
  }


  /* Calcs for post-meeting feedback rating */

  export class RatingDurationCalc
      extends DurationCalc<OptGrouping, RatingOpts> {

    initResult() { return emptyOptGrouping(); }

    processOne(
      event: Stores.Events.TeamEvent,
      duration: number,
      results: OptGrouping
    ) {
      if (!event.feedback.rating && !this._opts.showNone) {
        return results;
      }

      return groupAnnotations([{
        event: event,
        value: duration,
        groups: event.feedback.rating ? [event.feedback.rating.toString()] : []
      }], results);
    }
  }

  export class RatingDateDurationCalc extends DateDurationCalc<RatingOpts> {

    getGroups(event: Stores.Events.TeamEvent) {
      if (!event.feedback.rating && !this._opts.showNone) {
        return Option.none<string[]>();
      }
      return Option.some(
        event.feedback.rating ? [event.feedback.rating.toString()] : []
      );
    }
  }

}
