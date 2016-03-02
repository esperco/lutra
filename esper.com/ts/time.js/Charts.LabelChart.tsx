/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Charts.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.LabelSelector.tsx" />

module Esper.Charts {

  // Store for currently selected labels (used by LabelChart below)
  interface LabelSelection {
    labels: string[];
    unlabeled: boolean;
    all: boolean;
  }
  export var LabelSelectStore = new Model.StoreOne<LabelSelection>();

  // Action to update selected labels
  function updateLabels(x: {
      all: boolean;
      unlabeled: boolean;
      labels: string[];
  }) {
    LabelSelectStore.set(x);
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
    protected getCal() {
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
      Should only be called once data is available. Automatically filters
      out unselected labels.
    */
    protected getDisplayResults() {
      var displayResults = this.getRawDisplayResults();
      var selectedLabels = this.getSelectedLabels(displayResults);

      // Filter by selected labels (if applicable)
      return _.filter(displayResults,
        (c) => _.includes(selectedLabels, c.labelNorm)
      );
    }

    protected getExclusiveDisplayResults() {
      var displayResults = this.getDisplayResults();
      var selectedLabels = this.getSelectedLabels(displayResults);
      var stats = (this.sync()[0].items) || [];
      var exclusiveResults = TimeStats.getExclusiveDisplayResults(
        stats, selectedLabels);

      // Produce consistent sort (will have to re-sort for pie charts)
      return _.sortBy(exclusiveResults, (x) => -x.totalCount);
    }

    private getRawDisplayResults() {
      var pair = this.sync();
      if (!pair || !pair[0]) {
        throw new Error("getDisplayResults called before data ready");
      }

      var stats = (pair[0].items) || [];
      var results = TimeStats.getDisplayResults(stats);

      // Produce consistent sort
      return _.sortBy(results, (x) => -x.totalCount);
    }

    // Return label selection, alternatively gets a list of default labels
    // given (sorted) display results
    protected getSelectedLabels(displayResults: TimeStats.DisplayResults)
      : string[]
    {
      var labelNorms = _.map(displayResults, (r) => r.labelNorm);
      if (this.params.allLabels) {
        return labelNorms;
      }
      return this.params.selectedLabels || labelNorms.slice(0, 4);
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
      return !this.getDisplayResults().length;
    }

    noDataMsg() {
      return <span>
        No data found.{" "}
        <a onClick={() => Route.nav.path("/calendar-labeling")}>
          Click here to go to your calendar and label events.
        </a>
      </span>;
    }

    // Render label selector based on what labels are actually there
    renderSelectors() {
      // Safety check
      var stats: ApiT.CalendarStats[] = Option.cast(this.sync()).match({
        none: () => null,
        some: (d) => d[0] && d[0].items
      });
      if (! stats) return;

      var displayResults = this.getRawDisplayResults();

      // Conform to LabelSelector syntax
      var labels = _.map(displayResults, (r) => ({
        id: r.labelNorm,
        displayAs: r.displayAs,
        count: r.totalCount
      }));

      var totalCount = _.sumBy(stats,
        (s) => _.sumBy(s.partition,
          (p) => p.event_count));
      var unlabeledCount = _.sumBy(stats, (s) => {
        var partitions = _.filter(s.partition,
          (p) => p.event_labels.length === 0);
        if (partitions.length) {
          return partitions[0].event_count;
        }
        return 0;
      });

      var selectedLabels = this.getSelectedLabels(displayResults);

      return <div className="esper-menu-section">
        <div className="esper-subheader">
          <i className="fa fa-fw fa-tags" />{" "}
          Labels
        </div>
        <Components.LabelSelector labels={labels}
          totalCount={totalCount}
          unlabeledCount={unlabeledCount}
          selected={selectedLabels || []}
          allSelected={this.params.allLabels || false}
          unlabeledSelected={this.params.unlabeled || false}
          updateFn={updateLabels}
        />
      </div>;
    }
  }
}
