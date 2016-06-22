/*
  Misc helper function for Highcharts
*/

module Esper.Charting {

  /* Types */

  // Represent a series of individual events
  export interface EventSeries {
    name: string,
    cursor: string,
    color: string,
    stack: number,
    index: number,
    data: HighchartsDataPoint[]
  };

  export interface PeriodGroup extends EventStats.OptGrouping {
    period: Period.Single|Period.Custom;
    current: boolean; // Is this the "current" or active group?
  }

  /*
    Generate event series data from period groups
  */
  export function eventSeries(groups: PeriodGroup[], opts?: {
    displayName?: (key: string) => string; // Map key to value
    noneNone?: () => string;               // If null, will not display none
    sortFn?: (keys: string[]) => string[]  // Sort keys
    colorFn?: (key: string) => string;     // Color of key
    yFn?: (v: number) => number;           // Display version of values
  }): EventSeries[] {
    var opts = opts || {};

    /*
      Get all keys across all groups -- needed to properly chart where key
      might be present in one group but not another
    */
    var keys: string[] = [];
    _.each(groups,
      (g) => keys = keys.concat(_.keys(g.some))
    );
    keys = _.uniq(keys);
    if (opts.sortFn) {
      keys = opts.sortFn(keys);
    }

    // Hash indices for quick loopup
    var keyMap: {[index: string]: number} = {};
    _.each(keys, (k, i) => keyMap[k] = i);

    // Generate actual series
    var series: EventSeries[] = []
    _.each(groups, (g) => {
      _.each(g.some, (value, key) => {
        var index = keyMap[key];
        series.push({
          name: opts.displayName ? opts.displayName(key) : key,
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
    });

    return series;
  }


  /* Helper functions for Highcharts */

  export function onEventClick(event: Stores.Events.TeamEvent) {
    // Confirm predicted labels when opening single event
    Actions.EventLabels.confirm([event]);

    Layout.renderModal(Containers.eventEditorModal([event]));
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
