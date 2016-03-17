/*
  Bar chart for showing label durations over time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export interface LabelIntervalChartJSON extends LabelChartJSON {
    chartParams?: {
      labels?: string[];
      unlabeled?: boolean;
      allLabels?: boolean;
      interval?: TimeStats.Interval;
    };
  }

  export class DurationsOverTime extends LabelChart<LabelIntervalChartJSON> {
    cleanParams(params: LabelIntervalChartJSON|ChartJSON)
      : LabelIntervalChartJSON
    {
      var req = TimeStats.intervalCountRequest(5, TimeStats.Interval.WEEKLY);
      params.start = params.start || req.windowStart.getTime();
      params.end = params.end || req.windowEnd.getTime();

      var ret = super.cleanParams(params);
      if (_.isUndefined(ret.chartParams.interval)) {
        ret.chartParams.interval = req.interval;
      }

      return ret;
    }

    async() {
      var cal = this.getCal();
      return TimeStats.async(cal.teamId, cal.calId, {
        windowStart: new Date(this.params.start),
        windowEnd: new Date(this.params.end),
        interval: this.params.chartParams.interval
      });
    }

    sync() {
      // Get stats from store + data status
      var cal = this.getCal();
      return TimeStats.get(cal.teamId, cal.calId, {
        windowStart: new Date(this.params.start),
        windowEnd: new Date(this.params.end),
        interval: this.params.chartParams.interval
      });
    }

    renderChart() {
      var formatted = TimeStats.formatWindowStarts(
        this.sync()[0].items,
        this.params.chartParams.interval);

      var series = _.map(this.getDisplayResults(), (c) => {
        return {
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          data: _.map(c.durations, (value) => TimeStats.toHours(value))
        }
      });

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        plotOptions: {
          column: {
            borderWidth: 0
          }
        },

        xAxis: {
          categories: formatted.groupLabels
        },

        yAxis: {
          title: { text: "Time (Hours)" }
        },

        series: series
      }} units="Hours" />;
    }

    /////

    // Default period selector
    renderPeriodSelector() {
      var selected: TimeStats.RequestPeriod = {
        windowStart: new Date(this.params.start),
        windowEnd: new Date(this.params.end),
        interval: this.params.chartParams.interval
      };

      return <Components.IntervalRangeSelector
        selected={selected}
        updateFn={(req) => this.updatePeriod(req)}
        showIntervals={true}
        dateLimitForInterval={TimeStats.dateLimitForInterval}
        dateLimit={TimeStats.MAX_TIME}
        minDate={TimeStats.MIN_DATE}
        maxDate={TimeStats.MAX_DATE}
      />;
    }

    updatePeriod(req: TimeStats.RequestPeriod) {
      this.updateRoute({
        props: this.extendCurrentProps({
          start: req.windowStart.getTime(),
          end: req.windowEnd.getTime(),
          chartParams: _.extend({}, this.params.chartParams, {
            interval: req.interval
          })
        })
      });
    }
  }
}
