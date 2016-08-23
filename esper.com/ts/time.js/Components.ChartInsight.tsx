/*
  Base class for a blob of text that depends on some calculation
*/

/// <reference path="./Components.Chart.tsx" />

module Esper.Components {
  export abstract class ChartInsight<T, U> extends Chart<T, U> {
    // For insights, OK to leave blank if error, busy (there should be some
    // accompanying other chart to flash messages)
    renderMsg() { return <span />; }

    // Always return false -- let renderMain handle no data scenario
    noData(data: T) { return false; }
  }

  export abstract class ChartGroupingInsight<U>
    extends ChartInsight<Types.EventOptGrouping, U> { }
}
