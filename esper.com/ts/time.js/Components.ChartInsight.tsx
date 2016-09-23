/*
  Base class for a blob of text that depends on group calc
*/

/// <reference path="./Components.Chart.tsx" />

module Esper.Components {
  export abstract class GroupChartInsight
         extends Chart<Types.GroupState, Types.ChartProps> {

    abstract getGroupBy(): Types.GroupBy;

    getCalc(props: Types.ChartProps): Calc<Types.GroupState> {
      // Swap out GroupBy for class designated one
      props = _.clone(props);
      props.groupBy = this.getGroupBy();

      return EventStats.defaultGroupDurationCalc(
        props.eventsForRanges,
        Charting.getFilterFns(props),
        (e) => props.groupBy.keyFn(e, props)
      )
    }

    /*
      Don't update if props are mostly the same. This should be by-passed if
      calc is firing because it calls forceUpdate
    */
    shouldComponentUpdate(newProps: Types.ChartProps) {
      return !Charting.eqProps(newProps, this.props);
    }
  }
}
