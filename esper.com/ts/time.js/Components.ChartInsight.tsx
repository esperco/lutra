/*
  Base class for a blob of text that depends on some calculation
*/

/// <reference path="./Components.Chart.tsx" />

module Esper.Components {
  export abstract class ChartInsight<T, U> extends Chart<T, U> {
    // For insights, OK to leave blank if no data (there should be some
    // accompanying other chart to flash an error)
    renderMsg() { return <span />; }
  }

  export abstract class ChartGroupingInsight<U>
    extends ChartInsight<Types.EventOptGrouping, U> {

    noData(data: Types.EventOptGrouping) {
      return _.isEmpty(data.none.annotations) && _.isEmpty(data.some);
    }
  }
}
