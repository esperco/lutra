/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./Components.PeriodSelector.tsx" />
/// <reference path="./Components.Chart.tsx" />
/// <reference path="./Components.EmailModal.tsx" />
/// <reference path="./Layout.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

/*
  Page for seeing label stats over time
*/
module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Action to update our selection -- also triggers async calls
  function updateSelection(teamId: string, calId: string) {
    var current = Calendars.selectStore.val();
    Calendars.selectStore.set({teamId: teamId, calId: calId});
    updateAsync();

    // Clear label selection and colors if switching teams (default)
    if (current && current.teamId !== teamId) {
      labelSelectStore.unset();
      Colors.resetColorMap();
    }
  }

  // Store for currently selected interval
  var intervalSelectStore = new Model.StoreOne<TimeStats.Interval>();

  // Set some defaults
  function setDefaults() {
    if (! intervalSelectStore.isSet()) {
      intervalSelectStore.set(TimeStats.Interval.WEEKLY);
    }
    Calendars.setDefault();
    updateAsync();
  }

  // Hard-coded (for now) total number of intervals
  export var NUM_INTERVALS = 5;

  // Action to update selected interval
  function updateInterval(interval: TimeStats.Interval) {
    intervalSelectStore.set(interval);
    updateAsync();
  }

  // Call from update actions to trigger async actions
  function updateAsync() {
    var calSelect = Calendars.selectStore.val();
    var intervalSelect = intervalSelectStore.val();
    if (calSelect && intervalSelect !== undefined) {
      TimeStats.intervalQuery.async({
        teamId: calSelect.teamId,
        calId: calSelect.calId,
        numIntervals: NUM_INTERVALS, // Hard-coded for now
        interval: intervalSelect
      });
    }
  }

  // Store for currently selected labels
  interface LabelSelection {
    labels: string[];
  }
  var labelSelectStore = new Model.StoreOne<LabelSelection>();

  // Action to update selected labels
  function updateLabels(labels: string[]) {
    labelSelectStore.set({
      labels: labels
    });
  }


  // Export stores with prefix for test access
  export var lotIntervalSelectStore = intervalSelectStore;
  export var lotLabelSelectStore = labelSelectStore;


  ////////

  // Track view
  interface TimeStatsView extends TimeStats.StatRequest {
    labels: string[];
  }
  var currentView: TimeStatsView;
  var currentTimer: number;
  function trackView(request?: TimeStats.StatRequest, labels?: string[]) {
    // Cancel existing request
    if (currentTimer) { clearTimeout(currentTimer); }

    if (request) {
      var view = _.extend({
        labels: labels || []
      }, request) as TimeStatsView;
      currentView = view;

      // Set timeout to post Analytics tracking call after 3 seconds, but only
      // if we're still looking at the same view
      currentTimer = setTimeout(function() {
        if (_.eq(currentView, view)) {
          Analytics.track(Analytics.Trackable.ViewTimeStats, {
            teamId: view.teamId,
            calId: view.calId,
            numIntervals: view.numIntervals,
            interval: TimeStats.Interval[view.interval],
            labels: view.labels,
            labelCount: view.labels.length
          });
        }
      }, 3000);
    }
  }

  /////

  export class LabelsOverTime extends Component<{}, {}> {
    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    getResults() {
      // Clear previous analytics view
      trackView(null);

      // Get selections and data
      var selectedInterval = intervalSelectStore.val();
      var selectedCal = Calendars.selectStore.val();
      if (selectedCal && selectedCal.calId && selectedCal.teamId) {
        // Get selected team
        var team = Teams.get(selectedCal.teamId);
        if (! team) { throw new Error("Selected unavailable team"); }

        var queryRequest = {
          teamId: selectedCal.teamId,
          calId: selectedCal.calId,
          numIntervals: NUM_INTERVALS, // Hard-coded for now
          interval: selectedInterval
        };
        return TimeStats.intervalQuery.get(queryRequest);
      }
    }

    render() {
      // Get selections and data
      var selectedInterval = intervalSelectStore.val();
      var selectedCal = Calendars.selectStore.val();
      var selectedTeamId = selectedCal && selectedCal.teamId;
      var selectedCalId = selectedCal && selectedCal.calId;
      var results = this.getResults();
      var computed = TimeStats.getDurationsOverTime(results) || [];
      var labelStoreVal = labelSelectStore.val();
      var selectedLabels: string[] = labelStoreVal ?
        labelStoreVal.labels :
        _.map(computed.slice(0, 4), (v) => v.label);

      // Render view
      return <div id="labels-over-time-page"
                  className="esper-full-screen minus-nav">
        <div className="esper-left-sidebar padded">
          <Components.CalSelector
            selectedTeamId={selectedTeamId}
            selectedCalId={selectedCalId}
            updateFn={updateSelection} />
          {this.renderLabels(computed, selectedLabels)}
        </div>
        <div className="esper-right-content padded">
          <div className="esper-header clearfix">
            <h4 className="pull-left">
              <i className="fa fa-fw fa-bar-chart"></i>{" "}
              Labeled Events Over Time
            </h4>
            <div className="pull-right">
              <button className="btn btn-default"
                  onClick={this.openEmail.bind(this) }>
                  <b>Request Custom Report</b>
              </button>
              {" "}
              <button className="btn btn-default"
                      onClick={this.refresh.bind(this)}>
                <i className="fa fa-fw fa-refresh" title="refresh" />
              </button>
              {" "}
              <Components.PeriodSelector
                selected={selectedInterval}
                updateFn={updateInterval} />
              {" "}
            </div>
          </div>
          {this.renderChart(results, computed, selectedLabels)}
        </div>
      </div>;
    }

    renderChart(results: TimeStats.StatResults,
                computed: TimeStats.DurationsOverTimeResults,
                selectedLabels: string[])
    {
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
      } else if (!results.ready) {
        return <div className="esper-center">
          <span className="esper-spinner esper-large" />
        </div>;
      }

      var formmated = TimeStats.formatWindowStarts(results,
        intervalSelectStore.val());
      var horizontalLabel = formmated.typeLabel;
      var columnLabels = formmated.groupLabels;
      var datasets = _.map(computed, (c) => {
        var baseColor = Colors.getColorForLabel(c.label);
        return {
          label: c.label,
          fillColor: baseColor,
          strokeColor: Colors.darken(baseColor, 0.3),
          highlightFill: Colors.lighten(baseColor, 0.3),
          highlightStroke: baseColor,
          data: _.map(c.values, (value) => TimeStats.toHours(value))
        }
      });
      var data = {
        labels: columnLabels,
        datasets: datasets
      };

      // var data = this.getChartData(results, startFormat);
      return <Components.BarChart units="Hours"
              verticalLabel="Time (Hours)"
              horizontalLabel={horizontalLabel}
              data={data} />;
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className="esper-expanded minus-subheader padded">
        <div className="panel panel-default esper-focus-message">
          <div className="panel-body">
            {elm}
          </div>
        </div>
      </div>
    }

    renderLabels(computed: TimeStats.DurationsOverTimeResults,
                 selectedLabels: string[]) {
      if (!computed) {
        return <span></span>;
      } else {
        var allLabels = _.map(computed, (c): [string, string] => [
          c.label,
          TimeStats.toHours(c.total) + "h"
        ]);
        return <Components.LabelSelector
          allLabels={allLabels}
          selectedLabels={selectedLabels}
          updateFn={updateLabels} />;
      }
    }

    refresh() {
      TimeStats.intervalQuery.invalidate();
      updateAsync();
    }

    openEmail() {
      Layout.renderModal(<Components.EmailModal title="Request Custom Stats">
        <p>Want something other than the default options? Give a suggestion,
        tweet us, and we'll send you a report promptly.</p>
      </Components.EmailModal>);
    }

    componentDidMount() {
      this.setSources([
        Calendars.selectStore,
        labelSelectStore,
        intervalSelectStore,
        TimeStats.intervalQuery
      ]);
    }
  }
}

