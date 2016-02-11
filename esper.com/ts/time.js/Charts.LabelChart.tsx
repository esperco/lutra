/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Charts.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Components.Section.tsx" />
/// <reference path="./Components.ListSelector.tsx" />

module Esper.Charts {

  // Store for currently selected labels (used by LabelChart below)
  interface LabelSelection {
    labels: string[];
  }
  export var LabelSelectStore = new Model.StoreOne<LabelSelection>();

  // Action to update selected labels
  function updateLabels(labels: {groupId: string, id: string}[]) {
    LabelSelectStore.set({
      labels: _.map(labels, (l) => l.id)
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
      return this.params.selectedLabels || _.map(
        displayResults.slice(0, 4), (v) => v.labelNorm
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
      if (! (this.sync() && this.sync()[0])) return;

      var displayResults = this.getRawDisplayResults();

      // Only one label groups (for now)
      var groups = [{
        id: "",
        choices: _.map(displayResults, (d) => {
          return {
            id: d.labelNorm,
            displayAs: d.displayAs || d.labelNorm,
            badgeText: d.totalCount.toString(),
            badgeColor: Colors.getColorForLabel(d.labelNorm)
          };
        })
      }]

      // Conform to ListSelector syntax
      var selectedIds = _.map(this.getSelectedLabels(displayResults),
        (label) => {
          return {
            id: label,
            groupId: ""
          }
      });

      return <Components.BorderlessSection
              icon="fa-tags" title="Select Labels">
        <Components.ListSelector groups={groups}
          selectedIds={selectedIds}
          selectOption={Components.ListSelectOptions.MULTI_SELECT}
          updateFn={updateLabels}
        />
        <div className="esper-subsection-footer">
          <a className="esper-link" target="_blank"
             onClick={this.editLabels.bind(this)}>
            <i className="fa fa-fw fa-cog"></i>
            {" "}Configure Labels
          </a>
        </div>
      </Components.BorderlessSection>;
    }

    editLabels() {
      Layout.renderModal(<Components.LabelAddModal
        onHidden={this.async.bind(this)}
      />);
    }
  }
}
