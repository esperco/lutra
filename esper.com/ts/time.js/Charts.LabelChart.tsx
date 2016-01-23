/// <reference path="./Charts.tsx" />
/// <reference path="./TimeStats.ts" />

module Esper.Charts {

  // Store for currently selected labels (used by LabelChart below)
  interface LabelSelection {
    labels: string[];
  }
  export var LabelSelectStore = new Model.StoreOne<LabelSelection>();

  // Action to update selected labels
  function updateLabels(labels: string[]) {
    LabelSelectStore.set({
      labels: labels
    });
  }


  /*
    Base class for chart with labels (using stats2 API)
  */
  export abstract class LabelChart extends Chart {
    async() {
      var cal = this.getCal();
      return TimeStats.async(cal.teamId, cal.calId, {
        windowStart: this.params.windowStart,
        windowEnd: this.params.windowEnd,
        interval: this.params.interval
      });
    }

    sync() {
      // Get stats from store + data status
      var cal = this.getCal();
      return TimeStats.get(cal.teamId, cal.calId, {
        windowStart: this.params.windowStart,
        windowEnd: this.params.windowEnd,
        interval: this.params.interval
      });
    }

    // Label Stats currently only supports 1 calendar
    getCal() {
      // Label Stats currently only support 1 cal
      var cal = this.params.calendars && this.params.calendars[0];

      // Must check calendar length > 0 before calling
      if (! cal) {
        throw new Error("Must select calendar");
      }
      return cal;
    }

    /*
      Display results = stored stats with some formatting and normalization.
      Should only be called once data is available
    */
    getDisplayResults() {
      var pair = this.sync();
      if (!pair || !pair[0]) {
        throw new Error("getDisplayResults called before data ready");
      }

      var stats = (pair[0].items) || [];
      var results = TimeStats.getDisplayResults(
        stats, this.getCal().teamId);

      // Produce consistent sort
      return _.sortBy(results, (x) => -x.totalCount);
    }

    getExclusiveDisplayResults() {
      var pair = this.sync();
      if (!pair || !pair[0]) {
        throw new Error("getDisplayResults called before data ready");
      }

      var stats = (pair[0].items) || [];
      var results = TimeStats.getExclusiveDisplayResults(
        stats, this.getCal().teamId);

      // Produce consistent sort (will have to re-sort for pie charts)
      return _.sortBy(results, (x) => -x.totalCount);
    }

    // Return label selection, alternatively gets a list of default labels
    // given (sorted) display results
    getSelectedLabels(displayResults: TimeStats.DisplayResults): string[] {
      return this.params.selectedLabels || _.map(
        displayResults.slice(0, 4), (v) => v.labelNorm
      );
    }

    // Fitler display results by selected labels
    filterResults(displayResults: TimeStats.DisplayResults) {
      var selectedLabels = this.getSelectedLabels(displayResults);

      // Filter by selected labels (if applicable)
      return _.filter(displayResults,
        (c) => _.contains(selectedLabels, c.labelNorm)
      );
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
      var displayResults = this.filterResults(this.getDisplayResults());
      return !displayResults.length;
    }

    // Render label selector based on what labels are actually there
    renderSelectors() {
      // Safety check
      if (! (this.sync() && this.sync()[0])) return;

      var displayResults = this.getDisplayResults()
      var labelData = _.map(displayResults, (d) => {
        return {
          labelNorm: d.labelNorm,
          displayAs: d.displayAs,
          badge: d.totalCount.toString()
        };
      });

      return <Components.LabelSelector
              allLabels={labelData}
              selectedLabels={this.getSelectedLabels(displayResults)}
              updateFn={updateLabels} />
    }
  }
}
