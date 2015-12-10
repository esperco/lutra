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

  interface LabelValues {
    name: string;
    total: number;
    values: number[];
  }

  interface LabelsOverTimeState {
    selectedCal: Calendars.CalSelection;
    selectedLabels: string[];
    selectedInterval: TimeStats.Interval;
    results: TimeStats.StatResults;
    labelValues: LabelValues[];
    allLabels: [string, string][]; // Label + Badget Text
  }

  export class LabelsOverTime extends Component<{}, LabelsOverTimeState> {
    constructor(props: {}) {
      setDefaults();
      super(props);
    }

    render() {
      if (this.state.selectedCal) {
        var selectedTeamId = this.state.selectedCal.teamId;
        var selectedCalId = this.state.selectedCal.calId;
      }

      return <div id="labels-over-time-page"
                  className="esper-full-screen minus-nav">
        <div className="container-fluid"><div className="row">
          <div className="col-xs-5 col-sm-3 col-lg-2 esper-left-sidebar padded">
            <Components.CalSelector
              selectedTeamId={selectedTeamId}
              selectedCalId={selectedCalId}
              updateFn={updateSelection} />
            {this.renderLabels()}
          </div>
          <div
            className="col-xs-7 col-sm-9 col-lg-10 esper-right-content padded">
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
                  selected={this.state.selectedInterval}
                  updateFn={updateInterval} />
                {" "}
              </div>
            </div>
            {this.renderChart()}
            </div>
          </div>
        </div>
      </div>;
    }

    renderChart() {
      var results = this.state.results;
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

      var horizontalLabel: string;
      var startFormat: string;
      switch(this.state.selectedInterval) {
        case TimeStats.Interval.DAILY:
          horizontalLabel = "Day"
          startFormat = "MMM D"
          break;
        case TimeStats.Interval.MONTHLY:
          horizontalLabel = "Month"
          startFormat = "MMM"
          break;
        default:
          horizontalLabel = "Week Starting";
          startFormat = "MMM D";
      }

      var data = this.getChartData(
        results,
        this.state.labelValues,
        startFormat
      );
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

    renderLabels() {
      var results = this.state.results;
      if (!results || !results.ready) {
        return <span></span>;
      } else {
        return <Components.LabelSelector
          allLabels={this.state.allLabels}
          selectedLabels={this.state.selectedLabels}
          updateFn={updateLabels} />;
      }
    }

    getChartData(results: TimeStats.StatResults,
                 sortedLabels: LabelValues[],
                 startFormat: string) {
      var labels = _.map(results.starts,
        // MMM d => Oct 4
        (start) => moment(start).format(startFormat)
      );

      var filteredLabels = _.filter(sortedLabels, (label) =>
        _.contains(this.state.selectedLabels, label.name)
      )

      var datasets = _.map(filteredLabels, (label) => {
        var baseColor = Colors.getColorForLabel(label.name);
        return {
          label: label.name,
          fillColor: baseColor,
          strokeColor: Colors.darken(baseColor, 0.3),
          highlightFill: Colors.lighten(baseColor, 0.3),
          highlightStroke: baseColor,
          data: _.map(label.values, (value) => TimeStats.toHours(value))
        }
      });

      return {
        labels: labels,
        datasets: datasets
      };
    }

    refresh() {
      TimeStats.intervalQuery.invalidate();
      updateAsync();
    }

    openEmail() {
      Layout.renderModal(<Components.EmailModal title="Request Custom Stats">
        <p>Want something other than the default options? Let us know and we'll
        see if we can generate something for you.</p>
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

    getState(): LabelsOverTimeState {
      // Clear previous analytics view
      trackView(null);

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
        var results = TimeStats.intervalQuery.get(queryRequest);

        if (results && results.ready) {
          // Aggregate time stats by label
          var agg = TimeStats.aggregate(results.stats);
          var labelsAgg = _.map(agg.by_label,
            (statEntry, name) => {
              return {
                name: name,
                total: statEntry.event_duration,
                values: statEntry.durationValues
              };
            }
          );

          // Filter out task-related labels
          labelsAgg = _.reject(labelsAgg, (label) =>
            label.name === team.team_label_new ||
            label.name === team.team_label_done ||
            label.name === team.team_label_canceled ||
            label.name === team.team_label_pending ||
            label.name === team.team_label_urgent ||
            label.name === team.team_label_in_progress
          );

          // Sort by total duration descending
          labelsAgg.sort((a, b) => b.total - a.total);
          var labelPairs = _.map(labelsAgg, (label): [string, string] => [
            label.name,
            TimeStats.toHours(label.total) + "h"
          ]);

          // If no selected labels, default to 4 most frequent labels
          var labelStoreVal = labelSelectStore.val();
          var selectedLabels: string[] = labelStoreVal ?
            labelStoreVal.labels :
            _.map(labelPairs.slice(0, 4), (pair) => pair[0]);

          trackView(queryRequest, selectedLabels);
        }
      }

      return {
        selectedCal: selectedCal,
        selectedLabels: selectedLabels || [],
        selectedInterval: selectedInterval,
        labelValues: labelsAgg,
        results: results,
        allLabels: labelPairs || []
      };
    }
  }
}

