/// <reference path="./Charts.tsx" />
/// <reference path="./DailyStats.ts" />

module Esper.Charts {

  /*
    Base class for autocharts (using daily-stats API)
  */
  export abstract class AutoChart extends Chart {
    static dateLimit = {months: 1};

    async() {
      return DailyStats.async(
        this.params.windowStart,
        this.params.windowEnd,
        this.params.calendars);
    }

    sync() {
      return DailyStats.get(
        this.params.windowStart,
        this.params.windowEnd,
        this.params.calendars);
    }

    isBusy() {
      var pair = this.sync();
      var dataStatus = pair && pair[1] && pair[1].dataStatus;
      return dataStatus !== Model.DataStatus.READY;
    }

    getError() {
      var pair = this.sync();
      var meta = pair && pair[1];
      if (meta && meta.dataStatus === Model.DataStatus.FETCH_ERROR) {
        return meta.lastError || new Error("Unknown Fetch Error");
      }
    }

    noData() {
      var data = this.sync()[0];
      return !_.find(data.daily_stats,
        (s) => s.scheduled && s.scheduled.length
      );
    }

    // No selectors for auto-chart
    renderSelectors() {
      return <span />;
    }
  }
}
