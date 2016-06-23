/*
  Misc helper function for Highcharts
*/

module Esper.Charting {

  /* Types */

  /*
    For use with charts where a series is a list of events, and each data
    point is a single event
  */
  export interface EventSeries {
    name: string,
    cursor: string,
    color: string,
    stack: number,
    index: number,
    data: HighchartsDataPoint[]
  };

  /*
    For use with charts where there is each data point in a series represents
    multiple events (e.g. events with a particular label)
  */
  export interface EventGroupSeries {
    name: string;
    cursor: string;
    index: number;
    data: {
      name: string;
      color: string;
      count: number; /* Not part of Highcharts -- our own attribute for
                        passing data to tooltip on how many events make
                        up this single datapoint */
      x: number;
      y: number;
      events: HighchartsPointEvents;
    }[]
  }

  // Data tied to a particular point in time
  export interface PeriodData<T> {
    period: Period.Single|Period.Custom;
    current: boolean; // Is this the "current" or active group?
    data: T;
  }

  export type PeriodGroup = PeriodData<EventStats.OptGrouping>;


  interface EventSeriesOpts {
    displayName?: (key: string) => string; // Map key to value
    noneName?: string;                     // If null, will not display none
    sortedKeys?: string[];                 // Pre-sorted keys for this chart
    colorFn?: (key: string) => string;     // Color of key
    yFn?: (v: number) => number;           // Display version of values
  }

  /*
    Generate event series data from period groups. Each group is one series
    with periods being assigned to different stacks.
  */
  export function eventSeries(groups: PeriodGroup[], opts?: EventSeriesOpts)
    : EventSeries[]
  {
    var opts = opts || {};
    var keys = opts.sortedKeys || sortKeys(groups);

    // Hash indices for quick loopup
    var keyMap: {[index: string]: number} = {};
    _.each(keys, (k, i) => keyMap[k] = i);

    // Generate actual series
    var series: EventSeries[] = []
    _.each(groups, (g) => {
      _.each(g.data.some, (value, key) => {
        var index = keyMap[key];
        series.push({
          name: Util.escapeHtml((opts.displayName || _.identity)(key)),
          cursor: "pointer",
          color: g.current ?
            (opts.colorFn ? opts.colorFn(key) : Colors.presets[index]) :
            Colors.lightGray,
          stack: Period.asNumber(g.period),
          index: Period.asNumber(g.period),
          data: _.map(value.annotations, (a) => ({
            name: Text.eventTitleForChart(a.event),
            x: index,
            y: opts.yFn ? opts.yFn(a.value) : a.value,
            events: {
              click: () => onEventClick(a.event)
            }
          }))
        });
      })

      // Handle none
      if (opts.noneName) {
        series.push({
          name: opts.noneName,
          cursor: "pointer",
          color: Colors.lightGray,
          stack: Period.asNumber(g.period),
          index: Period.asNumber(g.period),
          data: _.map(g.data.none.annotations, (a) => ({
            name: Text.eventTitleForChart(a.event),
            x: keys.length, // None @ end
            y: opts.yFn ? opts.yFn(a.value) : a.value,
            events: {
              click: () => onEventClick(a.event)
            }
          }))
        });
      }
    });

    return series;
  }

  /*
    Generate event group series data from period groups -- each period is
    one series and each group is a data point
  */
  export function eventGroupSeries(groups: PeriodGroup[],
                                   opts?: EventSeriesOpts): EventGroupSeries[]
  {
    var opts = opts || {};
    var keys = opts.sortedKeys || sortKeys(groups);

    var ret = _.map(groups, (g, periodIndex) => {
      let data = _.map(keys, (key, index) => ({
        name: Util.escapeHtml((opts.displayName || _.identity)(key)),
        color: opts.colorFn ? opts.colorFn(key) : Colors.presets[index],
        count: g.data.some[key] ? g.data.some[key].annotations.length : 0,
        x: periodIndex,
        y: (opts.yFn || _.identity)(
          g.data.some[key] ? g.data.some[key].total : 0),
        events: {
          click: () => onSeriesClick(
            g.data.some[key] ? _.map(g.data.some[key].annotations,
              (a) => a.event
            ) : []
          )
        }
      }));

      // Handle none
      if (opts.noneName) {
        data.push({
          name: opts.noneName,
          color: Colors.lightGray,
          count: g.data.none.annotations.length,
          x: periodIndex,
          y: (opts.yFn || _.identity)(g.data.none.total),
          events: {
            click: () => onSeriesClick(
              _.map(g.data.none.annotations, (a) => a.event)
            )
          }
        });
      }

      return {
        name: Text.fmtPeriod(g.period),
        cursor: "pointer",
        index: Period.asNumber(g.period),
        data: data
      };
    });

    return ret;
  }

  // Get all keys across multiple groups, then sort
  export function sortKeys(groups: PeriodGroup[]) {
    /*
      Get all keys across all groups -- needed to properly chart where key
      might be present in one group but not another. Also calculate totals.
    */
    var currentTotals: {[index: string]: number} = {};
    var aggregateTotals: {[index: string]: number} = {};
    _.each(groups, (g) => _.each(g.data.some, (v, k) => {
      aggregateTotals[k] = (aggregateTotals[k] || 0) + v.total;
      if (g.current) {
        currentTotals[k] = (currentTotals[k] || 0) + v.total;
      }
    }));
    var keys = _.keys(aggregateTotals);

    /*
      Sort by totals descending of current periodGroup, if any, then
      aggregate total.
    */
    return _.sortBy(keys,
      (k) => -currentTotals[k] || 0,
      (k) => -aggregateTotals[k] || 0
    );
  }


  /* Helper functions for Highcharts */

  export function onEventClick(event: Stores.Events.TeamEvent) {
    // Confirm predicted labels when opening single event
    Actions.EventLabels.confirm([event]);

    Layout.renderModal(Containers.eventEditorModal([event]));
    return false;
  }

  export function onSeriesClick(events: Stores.Events.TeamEvent[]) {
    Layout.renderModal(Containers.eventListModal(events));
    return false;
  }

  export function eventPointFormatter(): string {
    var point: HighchartsPointObject = this;
    var ret = "";
    ret += point.y.toString();
    ret += " / ";
    var totalHours = _.sumBy(point.series.data, (p) => p.y);
    ret += Text.hours(totalHours);
    ret += ` (${Text.events(point.series.data.length)})`
    return ret;
  }

  export var eventPointTooltip: HighchartsTooltipOptions = {
    formatter: null,
    pointFormatter: eventPointFormatter
  };

  export function countPointFormatter(): string {
    var point: HighchartsPointObject = this;
    var ret = "";
    ret += Text.hours(this.hours || this.y);
    if (this.count) {
      ret += " / " + Text.events(this.count);
    }
    if (this.percentage) {
      ret += ` (${Util.roundStr(this.percentage, 1)}%)`;
    }
    return ret;
  }

  export var countPointTooltip: HighchartsTooltipOptions = {
    formatter: null,
    pointFormatter: countPointFormatter
  }
}
