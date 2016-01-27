/*
  View for all of the charts
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./Components.ChartTypeModal.tsx" />
/// <reference path="./Components.IntervalRangeSelector.tsx" />
/// <reference path="./Charts.DurationsOverTime.tsx" />
/// <reference path="./Charts.PercentageRecent.tsx" />
/// <reference path="./Charts.PercentageOverTime.tsx" />
/// <reference path="./Charts.GuestDomains.tsx" />
/// <reference path="./Charts.TopGuests.tsx" />
/// <reference path="./Charts.DurationHistogram.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Rename module to fix name conflict
  var ChartsM = Esper.Charts;

  /* State Management */

  // Available chart options (map of integer index to class) -- used in
  // selector down below
  type ChartType = typeof ChartsM.Chart;
  export var chartTypes: ChartType[] = [
    ChartsM.DurationsOverTime,
    ChartsM.PercentageRecent,
    ChartsM.PercentageOverTime,
    ChartsM.TopGuests,
    ChartsM.GuestDomains,
    ChartsM.DurationHistogram
  ];

  // Store for current chart type - store index of class in chartTypes list
  export var ChartTypeStore = new Model.StoreOne<number>();

  // Action to update our selection -- triggers async calls
  function updateChartType(val: number|ChartType) {
    var index: number;
    var chartType: ChartType;
    if (typeof val === "number") {
      index = val;
      chartType = chartTypes[index];
    } else {
      index = _.findIndex(chartTypes, (t) => t === val);
      chartType = val;
    }
    ChartTypeStore.set(index);
    updateRequestedPeriod(defaultReqForChartType(chartType));
  }

  // Action to update our selection -- also triggers async calls
  function updateCalSelection(teamId: string, calId: string) {
    var current = Calendars.SelectStore.val();
    Calendars.SelectStore.set({teamId: teamId, calId: calId});
    updateAsync();

    // Clear label selection and colors if switching teams (default)
    if (current && current.teamId !== teamId) {
      ChartsM.LabelSelectStore.unset();
      Colors.resetColorMaps();
    }
  }

  // Store for requested time period
  export var RequestStore = new Model.StoreOne<TimeStats.RequestPeriod>();

  // Action to update time period for stats -- triggers async calls
  function updateRequestedPeriod(req: TimeStats.RequestPeriod) {
    RequestStore.set(req);
    updateAsync();
  }

  /*
    Gets a chart based on currently stored state -- returns null if
    insuffucient data
  */
  function getChart(): Charts.Chart {
    var chartType= ChartTypeStore.val();
    if (_.isUndefined(chartType) || chartType < 0) return;

    var calendar = Calendars.SelectStore.val();
    if (_.isUndefined(calendar)) return;

    var requestPeriod = RequestStore.val();
    if (!requestPeriod || !requestPeriod.windowStart ||
        !requestPeriod.windowEnd) return;

    var labelSelection = ChartsM.LabelSelectStore.val();
    var params: Charts.ChartParams = {
      windowStart: requestPeriod.windowStart,
      windowEnd: requestPeriod.windowEnd,
      calendars: [calendar],
      interval: requestPeriod.interval,
      selectedLabels: labelSelection && labelSelection.labels
    }

    /*
      Cast to <any> is necessary because val is subclass of the abstract
      class Charts.Chart. We want to initiate a new instance of this, but
      since it's abstract, TypeScript will complain.
    */
    var chartCls: any = chartTypes[chartType];
    if (chartCls) {
      return new chartCls(params);
    }
  }

  // Call from update actions to trigger async actions
  function updateAsync() {
    var chart = getChart();
    if (chart) {
      chart.async(); // No values => use default periods
    }
  }

  function refresh() {
    TimeStats.StatStore.reset();
    DailyStats.StatStore.reset();
    updateAsync();
  }

  // Called when view is loaded for the first time
  function setDefaults() {
    Calendars.setDefault();
    if (! ChartTypeStore.isSet()) {
      updateChartType(ChartsM.DurationsOverTime);
    } else {
      updateAsync();
    }
  }

  function defaultReqForChartType(chartType: ChartType)
    : TimeStats.RequestPeriod
  {
    // Autocharts, always one month
    if (chartType.prototype instanceof ChartsM.AutoChart) {
      return TimeStats.intervalCountRequest(1, TimeStats.Interval.MONTHLY);
    }

    switch (chartType) {
      case ChartsM.PercentageRecent:
        return TimeStats.intervalCountRequest(1, TimeStats.Interval.MONTHLY);
      default:
        return TimeStats.intervalCountRequest(5, TimeStats.Interval.WEEKLY);
    }
  }


  /* Analytics */

  var currentChart: Charts.Chart;
  var currentTimer: number;

  function trackView(chart: Charts.Chart) {
    // Cancel existing request
    if (currentTimer) { clearTimeout(currentTimer); }
    currentChart = chart;

    // Weed out incomplete views
    if (chart) {

      // Calculate start time relative to today
      var now = moment();
      var params = chart.params;
      var relStart = moment(params.windowStart).diff(now, 'days');
      var relEnd = moment(params.windowEnd).diff(now, 'days');

      // Set timeout to post Analytics tracking call after 3 seconds, but only
      // if we're still looking at the same view
      currentTimer = setTimeout(function() {
        if (_.eq(currentChart.params, chart.params)) {
          Analytics.track(Analytics.Trackable.ViewTimeStats, _.extend({
            labelCount: (params.selectedLabels || []).length,
            periodLength: relEnd - relStart
          }, chart.params));
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
      var chart = getChart();
      trackView(chart);

      var cal = Calendars.SelectStore.val() || {
        teamId: null, calId: null
      };

      // Render view
      return <div id="charts-page"
                  className="esper-full-screen minus-nav">
        <div className="esper-left-sidebar padded">
          <Components.CalSelector
            selectedTeamId={cal.teamId}
            selectedCalId={cal.calId}
            updateFn={updateCalSelection} />
          { chart ? chart.renderSelectors() : null }
        </div>
        <div className="esper-right-content padded">
          <div className="esper-header row clearfix">
            <div className="col-xs-8 col-sm-4">
              { this.renderChartSelector(chart) }
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
              { chart ? this.renderPeriodSelector(chart) : null }
            </div>
          </div>
          { this.renderChartCheck(chart) }
        </div>
      </div>;
    }

    renderChartSelector(chart: Charts.Chart) {
      var selected = _.findIndex(chartTypes, (c) => chart instanceof c);
      return (
        <select value={selected ? selected.toString() : ""}
                className="form-control"
                onChange={(event: React.SyntheticEvent) => {
                  var target = event.target as HTMLSelectElement;
                  updateChartType(parseInt(target.value))
                }}>
          { _.map(chartTypes, (c, i) =>
            <option key={i} value={i.toString()}>{c.displayName}</option>
          )}
        </select>);
    }

    renderPeriodSelector(chart: Charts.Chart) {
      var chartType = _.find(chartTypes, (c) => chart instanceof c);
      return <Components.IntervalRangeSelector
        selected={chart.params}
        updateFn={updateRequestedPeriod}
        showIntervals={chartType.usesIntervals}
        dateLimit={chartType.dateLimit}
        dateLimitForInterval={chartType.dateLimitForInterval}
        minDate={chartType.minDate}
        maxDate={chartType.maxDate}
      />;
    }

    /*
      Render any messages as appropriate in lieu of displaying chart, else
      display chart
    */
    renderChartCheck(chart: Charts.Chart) {
      if (! chart) {
        var calendar = Calendars.SelectStore.val();
        if (! calendar) {
          return this.renderMessage(<span>
            <i className="fa fa-fw fa-calendar"></i>{" "}
            Please select a calendar
          </span>);
        }

        var requestPeriod = RequestStore.val();
        if (!requestPeriod || !requestPeriod.windowStart ||
            !requestPeriod.windowEnd) {
          return this.renderMessage(<span>
            <i className="fa fa-fw fa-calendar"></i>{" "}
            Please select a proper time period.
          </span>);
        };

        return this.renderMessage(<span>
          <i className="fa fa-fw fa-bar-chart"></i>{" "}
          Please select a chart type
        </span>);
      }

      else if (chart.getError()) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          Error loading data
        </span>);
      }

      else if (chart.isBusy()) {
        return <div className="esper-center">
          <span className="esper-spinner esper-large" />
        </div>;
      }

      else if (chart.noData()) {
        return this.renderMessage(<span>
          No data found
        </span>);
      }

      return chart.renderChart();
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

    openChartTypeModal() {
      Layout.renderModal(<Components.ChartTypeModal />);
    }
  }
}
