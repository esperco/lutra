/// <reference path="./Charts.tsx" />
/// <reference path="./DailyStats.ts" />

module Esper.Charts {

  /*
    Base class for autocharts (using daily-stats API)
  */
  export abstract class AutoChart<T extends Charts.ChartJSON> extends Chart<T> {
    async() {
      return DailyStats.async(
        new Date(this.params.start),
        new Date(this.params.end),
        this.params.cals);
    }

    sync() {
      return DailyStats.get(
        new Date(this.params.start),
        new Date(this.params.end),
        this.params.cals);
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

    // No selectors for auto-chart by default
    renderSelectors() {
      return <span />;
    }
  }
}
