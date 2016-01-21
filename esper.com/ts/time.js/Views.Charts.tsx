/*
  View for all of the charts
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./Components.ChartTypeModal.tsx" />
/// <reference path="./Components.IntervalRangeSelector.tsx" />
/// <reference path="./Components.DurationsOverTime.tsx" />
/// <reference path="./Components.PercentageRecent.tsx" />
/// <reference path="./Components.PercentageOverTime.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  /* State Management */

  // Store for currently selected labels
  interface LabelSelection {
    labels: string[];
  }
  var LabelSelectStore = new Model.StoreOne<LabelSelection>();

  // Export for test helper to access
  export var chartsLabelSelectStore = LabelSelectStore;

  // Action to update selected labels
  function updateLabels(labels: string[]) {
    LabelSelectStore.set({
      labels: labels
    });
  }

  // Store for current chart type
  export enum ChartType {
    DurationsOverTime = 1,
    PercentageRecent,
    PercentageOverTime
  }
  var ChartTypeStore = new Model.StoreOne<ChartType>();
  export var chartsChartTypeStore = ChartTypeStore;

  // Action to update our selection -- triggers async calls
  function updateChartType(chartType: ChartType) {
    ChartTypeStore.set(chartType);
    updateRequestedPeriod(defaultReqForChartType(chartType));
  }

  // Action to update our selection -- also triggers async calls
  function updateCalSelection(teamId: string, calId: string) {
    var current = Calendars.SelectStore.val();
    Calendars.SelectStore.set({teamId: teamId, calId: calId});
    updateAsync();

    // Clear label selection and colors if switching teams (default)
    if (current && current.teamId !== teamId) {
      LabelSelectStore.unset();
      Colors.resetColorMap();
    }
  }

  // Action to update time period for stats -- triggers async calls
  function updateRequestedPeriod(req: TimeStats.TypedStatRequest) {
    TimeStats.RequestStore.set(req);
    updateAsync();
  }

  // Call from update actions to trigger async actions
  function updateAsync() {
    TimeStats.async(); // No values => use default periods
  }

  function refresh() {
    TimeStats.StatStore.reset();
    updateAsync();
  }

  // Called when view is loaded for the first time
  function setDefaults() {
    Calendars.setDefault();
    if (! ChartTypeStore.isSet()) {
      updateChartType(ChartType.DurationsOverTime);
    } else {
      updateAsync();
    }
  }

  function defaultReqForChartType(chartType: ChartType)
    : TimeStats.TypedStatRequest
  {
    switch (chartType) {
      case ChartType.PercentageRecent:
        return TimeStats.intervalCountRequest(1, TimeStats.Interval.MONTHLY);
      default:
        return TimeStats.intervalCountRequest(5, TimeStats.Interval.WEEKLY);
    }
  }


  // Type for representing values from all stores
  interface TimeStatsView {
    teamId: string;
    calId: string;
    labels: string[];
    chartType: ChartType;
    request: TimeStats.TypedStatRequest;
  }

  // Logic for getting selection and results data
  function getSelections() {
    var calSelect = Calendars.SelectStore.val();
    var calId = calSelect && calSelect.calId;
    var teamId = calSelect && calSelect.teamId;
    var labelSelect = LabelSelectStore.val();
    var labels = labelSelect && labelSelect.labels;
    var chartType = ChartTypeStore.val();
    var request = TimeStats.RequestStore.val();

    return {
      teamId: teamId,
      calId: calId,
      labels: labels, // May be null -- signifies that we should use defaults
      chartType: chartType,
      request: request
    };
  }


  // Type for getResults output below
  interface TimeStatsResults {
    busy: boolean;
    error: boolean;
    stats: ApiT.CalendarStats[];
    displayResults: TimeStats.DisplayResults;
    labelData: {
      labelNorm: string;
      displayAs: string;
      badge?: string;
    }[];
  }

  /*
    Get actual time stats results data based on selections.

    This function mutates state (although not stores) in two ways. First, it
    updates selected labels if no labels are selected. Second, it triggers an
    Analytics tracking request.
  */
  function getResults(selections: TimeStatsView): TimeStatsResults {
    // Reset analytics
    trackView(null);

    // Safety check
    if (!(selections.teamId && selections.calId && selections.request)) {
      return;
    }

    // Get stats from store + data status
    var pair = TimeStats.get(selections.teamId, selections.calId,
                              selections.request);
    var stats = pair && pair[0] && pair[0].items;
    var dataStatus = pair && pair[1] && pair[1].dataStatus;

    // Always compute durations over time since it's used for label display
    var displayResults = TimeStats.getDisplayResults(
      stats, selections.teamId) || [];
    displayResults = _.sortBy(displayResults, (x) => -x.totalCount);

    var labelData = _.map(displayResults, (d) => {
      return {
        labelNorm: d.labelNorm,
        displayAs: d.displayAs,
        badge: d.totalCount.toString()
      };
    });

    /*
      If we don't have selected labels, mutate selections to include labels
      first four labels based on usage
    */
    selections.labels = selections.labels ||
      _.map(displayResults.slice(0, 4), (v) => v.labelNorm);

    return {
      busy: dataStatus !== Model.DataStatus.READY,
      error: dataStatus === Model.DataStatus.FETCH_ERROR,
      stats: stats,
      displayResults: displayResults,
      labelData: labelData
    };
  }


  /* Analytics */

  var currentView: TimeStatsView;
  var currentTimer: number;

  function trackView(view: TimeStatsView) {
    // Cancel existing request
    if (currentTimer) { clearTimeout(currentTimer); }

    currentView = view;
    if (view && view.calId && view.teamId && view.labels &&
        view.labels.length && view.chartType && view.request)
    {
      // Calculate start time relative to today
      var now = moment();
      var relStart = moment(view.request.windowStarts[0]).diff(now, 'days');
      var relEnd = moment(view.request.windowEnd).diff(now, 'days');

      // Set timeout to post Analytics tracking call after 3 seconds, but only
      // if we're still looking at the same view
      currentTimer = setTimeout(function() {
        if (_.eq(currentView, view)) {
          Analytics.track(Analytics.Trackable.ViewTimeStats, _.extend({
            labelCount: view.labels.length,
            periodLength: relEnd - relStart
          }, view));
        }
      }, 3000);
    }
  }


  /* React Views */

  export class Charts extends Component<{}, {}> {
    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    renderWithData() {
      var selections = getSelections();
      var results = getResults(selections);

      // Render view
      return <div id="charts-page"
                  className="esper-full-screen minus-nav">
        <div className="esper-left-sidebar padded">
          <Components.CalSelector
            selectedTeamId={selections.teamId}
            selectedCalId={selections.calId}
            updateFn={updateCalSelection} />
          { results && results.labelData ?
            <Components.LabelSelector
              allLabels={results.labelData}
              selectedLabels={selections.labels}
              updateFn={updateLabels} /> :
            null
          }
        </div>
        <div className="esper-right-content padded">
          <div className="esper-header row clearfix">
            <div className="col-xs-8 col-sm-4">
              { this.renderChartSelector(selections) }
            </div>
            <div className="col-xs-4 col-sm-2 clearfix">
              <div className="pull-left">
                <a className="esper-subtle"
                   onClick={this.openChartTypeModal.bind(this)}>
                  <i className="fa fa-fw fa-question-circle" />
                </a>
              </div>
              <div className="pull-right">
                <button className="btn btn-default"
                        onClick={refresh}>
                  <i className="fa fa-fw fa-refresh" title="refresh" />
                </button>
              </div>
            </div>
            <div className="col-xs-12 col-sm-6">
              { this.renderPeriodSelector(selections) }
            </div>
          </div>
          { this.renderChartCheck(selections, results) }
        </div>
      </div>;
    }

    renderChartSelector(selections: TimeStatsView) {
      return <select value={selections.chartType ?
                            selections.chartType.toString() : ""}
                     className="form-control"
                     onChange={this.changeChartType.bind(this)}>
        <option value={ChartType.DurationsOverTime.toString()}>
          Total Duration Over Time
        </option>
        <option value={ChartType.PercentageRecent.toString()}>
          Percentage Allocation
        </option>
        <option value={ChartType.PercentageOverTime.toString()}>
          Percentage Over Time
        </option>
      </select>;
    }

    renderPeriodSelector(selections: TimeStatsView) {
      switch (selections.chartType) {
        case ChartType.PercentageRecent:
          return <Components.IntervalRangeSelector
            selected={selections.request}
            updateFn={updateRequestedPeriod}
          />;

        default:
          return <Components.IntervalRangeSelector
            selected={selections.request}
            updateFn={updateRequestedPeriod}
            showIntervals={true}
          />;
      }
    }

    /*
      Render any messages as appropriate in lieu of displaying chart, else
      display chart
    */
    renderChartCheck(selections: TimeStatsView, results: TimeStatsResults) {
      if (! results) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar
        </span>);
      } else if (results.error) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          Error loading data
        </span>);
      } else if (results.busy) {
        return <div className="esper-center">
          <span className="esper-spinner esper-large" />
        </div>;
      } else if (!_.find(results.stats,
                 (s) => s.partition && s.partition.length)) {
        return this.renderMessage(<span>
          No Data
        </span>);
      }

      return this.renderChart(selections, results);
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className="esper-expanded minus-subheader padded">
        <div className="panel panel-default esper-focus-message">
          <div className="panel-body">
            {elm}
          </div>
        </div>
      </div>;
    }

    renderChart(selections: TimeStatsView, results: TimeStatsResults) {
      // Pick chart class type and render
      return React.createElement(this.getChartType(selections.chartType), {
        selectedLabels: selections.labels,
        request: selections.request,
        stats: results.stats,
        displayResults: results.displayResults
      });
    }

    getChartType(chartType: ChartType) {
      var ret: typeof Components.TimeStatsChart;
      switch (chartType) {
        case ChartType.PercentageRecent:
          ret = Components.PercentageRecent;
          break;
        case ChartType.PercentageOverTime:
          ret = Components.PercentageOverTime;
          break;
        default:
          ret = Components.DurationsOverTime
      }
      return ret;
    }

    changeChartType(event: React.SyntheticEvent) {
      var target = event.target as HTMLSelectElement;
      var chartType: ChartType = parseInt(target.value);
      updateChartType(chartType);
    }

    openChartTypeModal() {
      Layout.renderModal(<Components.ChartTypeModal />);
    }
  }
}
