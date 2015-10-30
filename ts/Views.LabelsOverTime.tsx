/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./Components.Chart.tsx" />
/// <reference path="./TimeStats.ts" />

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
  var selectStore = new Model.StoreOne<CalSelection>();

  // Action to update our selection -- also triggers async calls
  function updateSelection(teamId: string, calId: string) {
    selectStore.set({teamId: teamId, calId: calId});
    TimeStats.intervalQuery.async({
      teamId: teamId,
      calId: calId,

      // Hard-coded for now
      numIntervals: 5,
      interval: TimeStats.Interval.WEEKLY
    });
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

  interface LabelsOverTimeState {
    selection: CalSelection;
    selectedLabels: string[];
    stats: TimeStats.StatResult[];
  }

  export class LabelsOverTime extends Component<{}, LabelsOverTimeState> {
    render() {
      if (this.state.selection) {
        var selectedTeamId = this.state.selection.teamId;
        var selectedCalId = this.state.selection.calId;
      }

      return <div id="labels-over-time-page" className="container-fluid padded">
        <div className="row">
          <div className="col-sm-3">
            <Components.CalSelector
              selectedTeamId={selectedTeamId}
              selectedCalId={selectedCalId}
              updateFn={updateSelection} />
            {this.renderLabels()}
          </div>
          <div className="col-sm-9">
            {this.renderChart()}
          </div>
        </div>
      </div>;
    }

    renderChart() {
      var stats = this.state.stats;
      if (! stats) {
        return <div>Please select a calendar</div>
      } else if (_.find(stats, (stat) => stat.error)) {
        return <div>Something broke!</div>
      } else if (_.find(stats, (stat) => !stat.ready)) {
        return <div>Loading &hellip;</div>
      }

      var data = this.getChartData(stats);
      return <Components.BarChart width={2} height={1}
        units="Hours" verticalLabel="Time (Hours)" data={data} />
    }

    renderLabels() {
      var stats = this.state.stats;
      if (!stats && _.find(stats, (stat) => !stat.ready)) {
        return <span></span>;
      } else {
        return <Components.LabelSelector
          allLabels={TimeStats.getLabels(stats)}
          selectedLabels={this.state.selectedLabels}
          updateFn={updateLabels} />;
      }
    }

    getChartData(stats: TimeStats.StatResult[]) {
      var labels = _.map(stats,
        // MMM d => Oct 4
        (stat) => "Week starting " + moment(stat.start).format("MMM D")
      );

      var dataValues: { [index: string]: number[] } = {};
      _.each(stats, (stat, i) => {
        if (stat && stat.ready) {
          _.each(stat.stats.by_label, (val, name) => {
            // Only included selected labels
            if (! _.contains(this.state.selectedLabels, name)) {
              return;
            }

            var list = dataValues[name] = dataValues[name] || [];

            // This label may be new, so prefill 0s up to current index
            _.times(i - list.length, () => {
              list.push(0);
            })

            /*
              Convert to hours and round to near .01 hour -- rounding
              may be slightly off because of floating point arithmetic
              but that should be OK
            */
            list.push(Number((val.event_duration / 3600).toFixed(2)));
          });

          // Bump up any remaining stats
          _.each(dataValues, (list, name) => {
            _.times(i + 1 - list.length, () => {
              list.push(0);
            });
          });
        }
      });

      var datasets = _.map(dataValues, (values, name) => {
        return {
          label: name,
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: values
        }
      });

      return {
        labels: labels,
        datasets: datasets
      };
    }

    componentDidMount() {
      this.setSources([
        selectStore,
        labelSelectStore,
        TimeStats.intervalQuery
      ]);
    }

    getState() {
      var selection = selectStore.val();
      if (selection && selection.calId && selection.teamId) {
        // Hard-code in selection for now
        // TODO: Make this user-changeable
        var stats = TimeStats.intervalQuery.get({
          teamId: selection.teamId,
          calId: selection.calId,
          numIntervals: 5,
          interval: TimeStats.Interval.WEEKLY
        });
        var labelStoreVal = labelSelectStore.val();
      }

      return {
        selection: selection,
        selectedLabels: (labelStoreVal && labelStoreVal.labels) || [],
        stats: stats
      };
    }
  }
}

