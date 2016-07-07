/*
  Misc helper function for Highcharts
*/

module Esper.Charting {

  /* Types */
  export type ChartType = "percent"|"absolute"|"calendar";

  // Base options needed to fetch and get events
  export interface BaseOpts<T> {
    teamId: string;
    calIds: string[];
    period: Period.Single|Period.Custom;
    extra: ExtraOpts & T;
  }

  export interface ExtraOptsMaybe {
    type?: ChartType;
    incrs?: number[];
    filterStr?: string;
  }

  export interface ExtraOpts extends ExtraOptsMaybe, EventStats.CalcOpts {
    type: ChartType;
    incrs: number[];
    filterStr: string;
  }

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

  export type PeriodOptGroup = PeriodData<EventStats.OptGrouping>;
  export type PeriodGrouping = PeriodData<EventStats.Grouping>;


  interface EventSeriesOpts {
    displayName?: (key: string) => string; // Map key to value
    noneName?: string;                     // If null, will not display none
    noneStart?: boolean;                   // Displays none at start if true
    sortedKeys?: string[];                 // Pre-sorted keys for this chart
    colorFn?: (key: string, pos: {         // Color of key
      // In case color is based on position in sort order
      index: number;
      total: number;
    }) => string;
    yFn?: (v: number) => number;           // Display version of values
  }

  /*
    Generate event series data from period groups. Each group is one series
    with periods being assigned to different stacks.
  */
  export function eventSeries(
    groups: PeriodOptGroup[],
    opts: EventSeriesOpts = {}
  ) : EventSeries[] {
    var keys = opts.sortedKeys || sortOptGroupKeys(groups);

    // Hash indices for quick loopup
    var keyMap: {[index: string]: number} = {};
    _.each(keys, (k, i) => keyMap[k] = i);

    // Generate actual series
    var series: EventSeries[] = []
    _.each(groups, (g) => {
      var total = _.keys(g.data.some).length;

      _.each(keys, (key, index) => {
        let value = g.data.some[key];
        series.push({
          name: Util.escapeBrackets((opts.displayName || _.identity)(key)),
          cursor: "pointer",
          color: g.current ?
            (opts.colorFn ? opts.colorFn(key, {
              index: index,
              total: total
            }) : Colors.presets[index]) :
            Colors.lightGray,
          stack: Period.asNumber(g.period),
          index: Period.asNumber(g.period),
          data: value && value.annotations.length ?
            _.map(value.annotations, (a) => ({
              name: Text.eventTitleForChart(a.event),
              x: index + (opts.noneStart ? 1 : 0),
              y: opts.yFn ? opts.yFn(a.value) : a.value,
              events: {
                click: () => onEventClick(a.event)
              }
            })) :

            /*
              We need to create an explicit zero-value data point to explicitly
              single to user that there is no data
            */
            [{
              name: Text.ChartEmptyEvent,
              x: index + (opts.noneStart ? 1 : 0),
              y: opts.yFn ? opts.yFn(0) : 0,
              events: { click: () => false }
            }]
        });
      });

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
            x: opts.noneStart ? 0 : keys.length, // None @ end
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


  interface EventGroupSeriesOpts extends EventSeriesOpts {
    subgroup?: string[]; // Drilldown to this subgroup path
    onDrilldown?: (path: string[]) => void;
  }

  /*
    Generate event group series data from period groups -- each period is
    one series and each group is a data point
  */
  export function eventGroupSeries(
    groups: PeriodOptGroup[],
    opts: EventGroupSeriesOpts = {}
  ): EventGroupSeries[] {
    let groupings = _.map(groups, (g) => ({
      period: g.period,
      current: g.current,
      data: g.data.some
    }));

    // Filter down to subgroups as appropriate
    if (! _.isEmpty(opts.subgroup)) {
      _.each(groupings, (g) => {
        _.each(opts.subgroup, (key) => {
          g.data = g.data[key] ? g.data[key].subgroups : {}
        });
      });
    }

    // Establish keys based on subgroups
    let keys = opts.sortedKeys || sortGroupingKeys(groupings);

    var ret = _.map(groupings, (g, periodIndex) => {
      let data = eventSubgroupData({
        grouping: g.data,
        keys: keys,
        periodIndex: periodIndex,
        opts: opts
      });

      // Handle none
      if (opts.noneName && _.isEmpty(opts.subgroup)) {
        let none = groups[periodIndex].data.none;
        let s = {
          name: opts.noneName,
          color: Colors.lightGray,
          count: none.annotations.length,
          x: periodIndex,
          y: (opts.yFn || _.identity)(none.totalValue),
          events: {
            click: () => onSeriesClick(
              _.map(none.annotations, (a) => a.event)
            )
          }
        };

        if (opts.noneStart) {
          data.unshift(s);
        } else {
          data.push(s);
        }
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

  function eventSubgroupData({grouping, keys, periodIndex, opts = {}}: {
    grouping: EventStats.Grouping;
    keys: string[];
    periodIndex: number;
    opts: EventGroupSeriesOpts;
  }) {
    return _.map(keys, (key, index) => {
      let group = grouping[key];
      let hasSubgroups = group && !!_.keys(group.subgroups).length
      let onClick = hasSubgroups && opts.onDrilldown ?
        () => opts.onDrilldown((opts.subgroup || []).concat([key])) && false :
        () => onSeriesClick(
          group ? _.map(group.annotations, (a) => a.event) : []
        );

      return {
        name: Util.escapeBrackets((opts.displayName || _.identity)(key)),
        color: opts.colorFn ? opts.colorFn(key, {
          index: index,
          total: keys.length
        }) : Colors.presets[index],
        count: group ? group.annotations.length : 0,
        x: periodIndex,
        y: (opts.yFn || _.identity)(group ? group.totalValue : 0),
        events: { click: onClick }
      }
    });
  }


  // Get all keys across multiple groups, then sort
  export function sortOptGroupKeys(groups: PeriodOptGroup[]) {
    var groupings = _.map(groups, (g) => ({
      period: g.period,
      current: g.current,
      data: g.data.some
    }));
    return sortGroupingKeys(groupings);
  }

  export function sortGroupingKeys(groups: PeriodGrouping[]) {
    /*
      Get all keys across all groups -- needed to properly chart where key
      might be present in one group but not another. Also calculate totals.
    */
    var currentTotals: {[index: string]: number} = {};
    var aggregateTotals: {[index: string]: number} = {};
    _.each(groups, (g) => _.each(g.data, (v, k) => {
      aggregateTotals[k] = (aggregateTotals[k] || 0) + v.totalValue;
      if (g.current) {
        currentTotals[k] = (currentTotals[k] || 0) + v.totalValue;
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
    if (point.y === 0) return "";

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
    ret += Text.hours(point.y);
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

  export function stackPointFormatter(): string {
    /*
      Not sure what type is supposed to be here -- we just care about total
      for now
    */
    var stack: { total: number } = this;
    return Text.hoursShort(stack.total);
  }
}
