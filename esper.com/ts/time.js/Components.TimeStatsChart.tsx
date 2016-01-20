/*
  Base class for a type of TimeStats chart
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface TimeStatsChartProps {
    selectedLabels: string[];
    request: TimeStats.TypedStatRequest;
    stats: ApiT.CalendarStats[]; // Raw stat data

    // Computed (non-exclusive display results)
    displayResults?: TimeStats.DisplayResults;
  }

  export class TimeStatsChart extends Component<TimeStatsChartProps, {}> {
    renderNoData() {
      return <div className="esper-expanded minus-subheader padded">
        <div className="panel panel-default esper-focus-message">
          <div className="panel-body">
            No Data
          </div>
        </div>
      </div>;
    }
  }
}
