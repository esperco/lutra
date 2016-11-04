/*
  Client-side time stat calculations.

  All chart calculations generally consist of converting a EventsForRange
  object to a RangeGroup. We do this with the following steps:

  - BATCH events for processing. Only one batch at a time is (synchronously)
    processed. The remainder are scheduled for async processing so as not to
    block the thread from updating the UI.

  - FILTER events by some preset group of filters.

  - WEIGH or annotate events -- i.e. assign some value (such as the event's
    duration) to each event for a given attribute (like a label or guest).

  - GROUP or reduce the weights to the RangeGroup object (which can used in
    actual charting with minimal computation).

  We used to use inherited calc classes to reuse code between different chart
  calculations but this got pretty unwieldy. So now we define a whole bunch
  of helper functions for each step that can easily be composed for the calc
  for any given chart.
*/

/// <reference path="./Calc.ts" />
/// <reference path="./Params.ts" />

module Esper.EventStats {

  /* Duration calculations */

  export interface DurationOpts {
    // Truncate duration if start is before this date/time
    truncateStart?: Date;

    // Truncate duration if end is after this date/time
    truncateEnd?: Date;

    // Segemnt based on overlap with working hours
    weekHours?: Types.WeekHours;
  }

  /*
    Calculate durations of events after adjusting for overlapping
  */
  interface DurationWrapper {
    event: Stores.Events.TeamEvent;
    duration: number;
  }

  interface DurationSegment {
    start: number; // Javascript time (milliseconds)
    end: number;   // Javascript time (milliseconds)
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

      // Map critical points of event to check for overlaps
      _.each(getSegments(e.event, opts), (s) => {
        var startStr = s.start.toString();
        var endStr = s.end.toString();
        startMap[startStr] = startMap[startStr] || [];
        startMap[startStr].push(e);
        endMap[endStr] = endMap[endStr] || [];
        endMap[endStr].push(e);
        criticalPoints.push(s.start);
        criticalPoints.push(s.end);
      });
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

  /*
    Returns start/end times of an events given truncation options. Basically
    chops our event up into time segments that overlap the time(s) we care
    about.
  */
  export function getSegments(event: Types.TeamEvent, opts: DurationOpts)
    : DurationSegment[]
  {
    // Truncate start
    var startM = moment(event.start).clone();
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
    if (end <= start) { return []; }

    if (opts.weekHours) {
      let ret: DurationSegment[] = [];
      let lastSegment: DurationSegment = null;
      while (startM.diff(endM) < 0) {
        WeekHours.getDayHours(startM, opts.weekHours).flatMap((dayHours) => {
          // Intersect portion of event for this day with dayHours
          let dayStart = startM.clone().startOf('day');
          return intersectSegments(
            { // Hours for this day
              start: dayStart.clone().add(dayHours.start).valueOf(),
              end: dayStart.clone().add(dayHours.end).valueOf()
            },

            { // Portion of event that overlaps this day
              start: startM.valueOf(),
              end: Math.min(endM.valueOf(),
                            startM.clone().endOf('day').valueOf())
            });
        }).match({
          none: () => null,
          some: (segment) => {
            /*
              If overlap or adjacent with last segment, extend. Add one
              millisecond to include segments that are adjacent.
            */
            if (lastSegment && (lastSegment.end + 1) >= segment.start) {
              lastSegment.end = segment.end;
            } else {
              lastSegment = segment;
              ret.push(segment);
            }
          }
        });

        // Go to next day
        startM = startM.startOf('day').add(1, 'day');
      }
      return ret;
    }

    // No weekHours, return entire period as segment
    return [{
      start: start,
      end: end
    }];
  }

  /*
    Given two time segments, returns a new segment with their intersection
  */
  function intersectSegments(s1: DurationSegment, s2: DurationSegment)
    : Option.T<DurationSegment>
  {
    let start = Math.max(s1.start, s2.start);
    let end = Math.min(s1.end, s2.end);
    if (end > start) {
      return Option.some({ start, end })
    } else {
      // No intersection
      return Option.none<DurationSegment>();
    }
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


  // Filter helpers ///////////////////////////

  export function filterEvents(
    events: Types.TeamEvent[],
    filters: Types.FilterFn[]
  ) {
    return _.filter(events,
      (e) => _.every(filters, (fn) => fn(e))
    );
  }


  // Batch Helpers ///////////////////////////

  // A single batch of events to process
  interface RangeBatch {
    events: Types.TeamEvent[];

    // Replace indices on RangeState
    rangeIndex: number;
    eventIndex: number;
  }

  /*
    Takes an EventsForRange object plus a batching function and returns a set
    of events plus new indices. The batching function should take a set
    of events and return of subset of those events to include in the batch.
  */
  function batchRange(
    state: Types.RangesState,
    batchFn: (events: Types.TeamEvent[]) => Types.TeamEvent[]
  ): RangeBatch {
    let events: Types.TeamEvent[] = [];
    let rangeIndex = state.rangeIndex;
    let eventIndex = state.eventIndex;

    /*
      Get current range and return a subset of events in this range for
      this batch. Multiple ranges should not be in same batch.
    */
    let eventsForRange = state.eventsForRanges[rangeIndex];
    if (eventsForRange) {
      let eventsInRange = eventsForRange.events.slice(eventIndex);
      events = batchFn(eventsInRange);
      eventIndex += events.length;

      // At end of range, go to start of next range.
      if (eventIndex >= eventsForRange.events.length) {
        rangeIndex += 1;
        eventIndex = 0;
      }
    }

    return { events, rangeIndex, eventIndex };
  }

  // Batches at least minEvents + overlapping events (for duration calc)
  export function batchOverlap(state: Types.RangesState, minEvents = 5)
    : RangeBatch
  {
    return batchRange(state, (events) => {
      let batch = events.slice(0, minEvents);
      let max = _(batch).map((e) => e.end.getTime()).max();
      let remainder = events.slice(minEvents);
      for (let i in remainder) {
        let next = remainder[i];
        if (next.start.getTime() < max) {
          max = Math.max(max, next.end.getTime());
          batch.push(next)
        } else {
          break;
        }
      }
      return batch;
    });
  }

  // Batches a fixed number of events
  export function batchFixed(state: Types.RangesState, minEvents = 5)
    : RangeBatch
  {
    return batchRange(state, (events) => events.slice(0, minEvents));
  }


  // Weight helpers ///////////////////////////

  /*
    Returns annotated events weighed by duration, split among each tag
    we're grouping by.
  */
  export function weighDuration(
    events: Types.TeamEvent[],
    groupFn: (event: Types.TeamEvent) => Option.T<string[]>,
    opts: EventStats.DurationOpts = {}
  ): Types.Weight[] {
    let wrappers = durationWrappers(events, opts);
    let weights = _.map(wrappers,
      (wrapper) => groupFn(wrapper.event).mapOr(
        [],
        (matches) => matches.length ?

          // Create annotation for each match
          _.map(matches, (match) => ({
            event: wrapper.event,
            value: wrapper.duration / matches.length, // Split evenly
            group: match
          })) :

          // Empty => empty group
          [{
            event: wrapper.event,
            value: wrapper.duration,
            group: null
          }]
      ));
    return _.flatten(weights);
  }

  // Simpler annotation -> each event counts as 1
  export function weighCount(
    events: Types.TeamEvent[],
    groupFn: (event: Types.TeamEvent) => Option.T<string[]>
  ): Types.Weight[] {
    let weights = _.map(events, (event) => groupFn(event).match({
      none: (): Types.Weight[] => [],
      some: (matches) => matches.length ?

        // Create annotation for each match
        _.map(matches, (match) => ({
          event: event,
          value: 1,
          group: match
        })) :

        // Empty => empty group
        [{
          event: event,
          value: 1,
          group: null
        }]
    }));
    return _.flatten(weights);
  }


  // Grouping Helpers ///////////////////////////

  export function emptyRangeGroup(ranges: [Date, Date][]): Types.RangesGroup {
    return {
      some: {},
      none: emptyRangeSeries(ranges),
      all: emptyRangeSeries(ranges)
    };
  }

  export function emptyRangeSeries(ranges: [Date, Date][]): Types.RangeSeries {
    return {
      values: _.map(ranges, emptyRangeValue),
      weights: [],
      totalValue: 0,
      totalUnique: 0,
      eventMap: {},
      events: []
    };
  }

  function emptyRangeValue(range: [Date, Date]): Types.RangeValue {
    return {
      range: range,
      weights: [],
      totalValue: 0,
      totalUnique: 0,
      eventMap: {},
      events: []
    }
  }

  // Adds weights to range group
  export function groupWeights(weights: Types.Weight[],
                               rangeState: Types.RangesState,
                               rangeGroup: Types.RangesGroup) {
    _.each(weights, (w) => {

      // Make sure we have a group + series to add to
      let groupSeries = (() => {
        let groupKey = w.group;
        if (_.isString(groupKey)) {
          if (! rangeGroup.some.hasOwnProperty(groupKey)) {
            let ranges = _.map(rangeState.eventsForRanges, (e) => e.range);
            rangeGroup.some[groupKey] = emptyRangeSeries(ranges);
          }
          return rangeGroup.some[groupKey];
        }
        return rangeGroup.none;
      })();

      // Should be value at index if we used emptyRangeSeries propertly.
      let groupValue = groupSeries.values[rangeState.rangeIndex];
      Log.assert(!!groupValue,
        "Missing value at range index " + rangeState.rangeIndex);

      // Only add to group if unique
      let eventKey = Stores.Events.strId(w.event);
      if (! groupValue.eventMap.hasOwnProperty(eventKey)) {
        groupValue.eventMap[eventKey] = w.event;
        groupValue.events.push(w.event);
        groupValue.totalUnique += 1;
        groupValue.totalValue += w.value;
        groupValue.weights.push(w);

        // Update series totals
        groupSeries.totalValue += w.value;
        groupSeries.weights.push(w);
        if (! groupSeries.eventMap.hasOwnProperty(eventKey)) {
          groupSeries.eventMap[eventKey] = w.event;
          groupSeries.events.push(w.event);
          groupSeries.totalUnique += 1;
        }

        // Update totals across groups as well
        rangeGroup.all.totalValue += w.value;
        rangeGroup.all.weights.push(w);
        if (! rangeGroup.all.eventMap.hasOwnProperty(eventKey)) {
          rangeGroup.all.eventMap[eventKey] = w.event;
          rangeGroup.all.events.push(w.event);
          rangeGroup.all.totalUnique += 1;
        }
      }
    });

    return rangeGroup;
  }


  // Misc Helpers /////////////

  /*
    Checks state to see whether we should keep going or return result.
    Returns appropriate return value for calc function
  */
  function endLoop<O extends Types.RangesState>(state: O) {
    return {
      next: state,
      done: state.rangeIndex >= state.eventsForRanges.length
    };
  }


  // Default range calc helpers
  export function defaultGroupCalc(
    eventsForRanges: Types.EventsForRange[],
    processor: (s: Types.GroupState) => Types.GroupState
  ) {
    return new Calc({
      eventsForRanges,
      rangeIndex: 0,
      eventIndex: 0,
      group: emptyRangeGroup(_.map(eventsForRanges, (e) => e.range))
    }, (s) => endLoop(processor(s)));
  }

  /*
    Default processing pipeline for selectors that just need to count each
    unique event under a key
  */
  export function defaultGroupCounterCalc(
    eventsForRanges: Types.EventsForRange[],
    groupFn: (event: Types.TeamEvent) => Option.T<string[]>
  ) {
    return defaultGroupCalc(eventsForRanges, (s) => {
      let { events, rangeIndex, eventIndex } = batchFixed(s);
      events = filterEvents(events, [Stores.Events.isActive]);
      let weights = weighCount(events, groupFn);
      let group = groupWeights(weights, s, s.group);
      return { eventsForRanges, rangeIndex, eventIndex, group };
    });
  }

  /*
    Count durations for each calc
  */
  export function defaultGroupDurationCalc(
    eventsForRanges: Types.EventsForRange[],
    filterFns: Types.FilterFn[],
    groupFn: (event: Types.TeamEvent) => Option.T<string[]>
  ) {
    return defaultGroupCalc(eventsForRanges, (s) => {
      let eventsForRange = s.eventsForRanges[s.rangeIndex];
      let [start, end] = eventsForRange ? eventsForRange.range : [null, null];

      // Events to process plus *new* rangeIndex  eventIndex
      let { events, rangeIndex, eventIndex } = batchOverlap(s);
      events = filterEvents(events, filterFns);
      let weights = weighDuration(events, groupFn, {
        truncateStart: start,
        truncateEnd: end
      });
      let group = groupWeights(weights, s, s.group);
      return { eventsForRanges, rangeIndex, eventIndex, group };
    });
  }

  /*
    Takes a list of events and returns it with some numeric values
  */
  export function annotationCalc(
    eventsForRanges: Types.EventsForRange[],
    valueFn: (e: Types.TeamEvent) => number
  ) {
    return new Calc<Types.AnnotationState>({
      eventsForRanges,
      rangeIndex: 0,
      eventIndex: 0,
      values: []
    }, (s) => {
      let { events, rangeIndex, eventIndex } = batchFixed(s);
      let values = s.values.concat(
        _.map(events, (e): [Types.TeamEvent, number] => [e, valueFn(e)])
      );
      return endLoop({
        eventsForRanges,
        rangeIndex,
        eventIndex,
        values: s.values
      });
    });
  }

  /*
    Returns a filtered list of events
  */
  export function simpleCounterCalc(
    eventsForRanges: Types.EventsForRange[],
    filterFns: Types.FilterFn[],
    ignoreRecurring=true
  ) {
    return new Calc<Types.CounterState>({
      eventsForRanges,
      rangeIndex: 0,
      eventIndex: 0,
      eventMap: {},
      events: [],
      total: 0
    }, (s) => {
      let { events, rangeIndex, eventIndex } = batchFixed(s);
      events = filterEvents(events, filterFns.concat([

        // Uniqueness check function takes into account recurring events
        (e) => {
          let strId = Stores.Events.strId(e, ignoreRecurring);
          if (s.eventMap.hasOwnProperty(strId)) {
            return false;
          }
          s.eventMap[strId] = e;
          return true;
        }]));

      return endLoop({
        eventsForRanges,
        rangeIndex,
        eventIndex,
        eventMap: s.eventMap,
        events: s.events.concat(events),
        total: s.total += events.length
      });
    });
  }

  // Filtering is like counter calc, but include recurring
  export function simpleFilterCalc(
    eventsForRanges: Types.EventsForRange[],
    filterFns: Types.FilterFn[]
  ) {
    return simpleCounterCalc(eventsForRanges, filterFns, false);
  }
}
