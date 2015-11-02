/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./Components.Chart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

/*
  Page for seeing label stats over time
*/
module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Store for currently selected team and calendar
  interface CalSelection {
    teamId: string;
    calId: string;
  }
  var calSelectStore = new Model.StoreOne<CalSelection>();

  // Action to update our selection -- also triggers async calls
  function updateSelection(teamId: string, calId: string) {
    var current = calSelectStore.val();

    calSelectStore.set({teamId: teamId, calId: calId});
    TimeStats.intervalQuery.async({
      teamId: teamId,
      calId: calId,

      // Hard-coded for now
      numIntervals: 5,
      interval: TimeStats.Interval.WEEKLY
    });

    // Clear label selection if switching teams (default)
    if (current && current.teamId !== teamId) {
      labelSelectStore.unset();
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


  /////

  interface LabelValues {
    name: string;
    total: number;
    values: number[];
  }

  interface LabelsOverTimeState {
    selectedCal: CalSelection;
    selectedLabels: string[];
    results: TimeStats.StatResults;
    labelValues: LabelValues[];
    allLabels: [string, string][]; // Label + Badget Text
  }

  export class LabelsOverTime extends Component<{}, LabelsOverTimeState> {
    render() {
      if (this.state.selectedCal) {
        var selectedTeamId = this.state.selectedCal.teamId;
        var selectedCalId = this.state.selectedCal.calId;
      }

      return <div id="labels-over-time-page" className="container-fluid">
        <div className="row">
          <div className="col-sm-3 col-lg-2 esper-max-minus-nav padded">
            <Components.CalSelector
              selectedTeamId={selectedTeamId}
              selectedCalId={selectedCalId}
              updateFn={updateSelection} />
            {this.renderLabels()}
          </div>
          <div className="col-sm-9 col-lg-10">
            <div className="esper-borderless-section">
              <h4 className="esper-header">
                <i className="fa fa-fw fa-bar-chart"></i>{" "}
                Labeled Events Over Time
              </h4>
              <div className="esper-content">
                {this.renderChart()}
              </div>
            </div>
          </div>
        </div>
      </div>;
    }

    renderChart() {
      var results = this.state.results;
      if (! results) {
        return <div>Please select a calendar</div>
      } else if (results.error) {
        return <div>Something broke!</div>
      } else if (!results.ready) {
        return <div>Loading &hellip;</div>
      }

      var data = this.getChartData(results, this.state.labelValues);
      return <Components.BarChart width={2} height={1}
        units="Hours" verticalLabel="Time (Hours)" data={data} />
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
                 sortedLabels: LabelValues[]) {
      var labels = _.map(results.starts,
        // MMM d => Oct 4
        (start) => "Week starting " + moment(start).format("MMM D")
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
          data: label.values
        }
      });

      return {
        labels: labels,
        datasets: datasets
      };
    }

    componentDidMount() {
      this.setSources([
        calSelectStore,
        labelSelectStore,
        TimeStats.intervalQuery
      ]);
    }

    getState(): LabelsOverTimeState {
      var selectedCal = calSelectStore.val();
      if (selectedCal && selectedCal.calId && selectedCal.teamId) {
        // Hard-code in selection for now
        // TODO: Make this user-changeable
        var results = TimeStats.intervalQuery.get({
          teamId: selectedCal.teamId,
          calId: selectedCal.calId,
          numIntervals: 5,
          interval: TimeStats.Interval.WEEKLY
        });

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
        }
      }

      return {
        selectedCal: selectedCal,
        selectedLabels: selectedLabels || [],
        labelValues: labelsAgg,
        results: results,
        allLabels: labelPairs || []
      };
    }
  }
}

