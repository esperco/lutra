/*
  Base class for chart - takes a set of calculations and renders once they're
  done. Renders intermediate states like fetching and calculating.
*/
module Esper.Components {
  interface Props<T extends EventStats.CalculationBase> {
    // Data is a list because we have calculation for each period
    data: {
      period: Period.Single|Period.Custom;
      current: boolean; // Is this the "active" period or a comparative period?
      calculation: T;
      events: Stores.Events.TeamEvent[];
      fetching: boolean;
      error: boolean;
    }[];
  }

  export abstract class Chart<T extends EventStats.CalculationBase>
         extends ReactHelpers.Component<Props<T>, {}> {
    componentDidMount() {
      this.setCalcSources();
    }

    componentDidUpdate() {
      this.setCalcSources();
    }

    setCalcSources() {
      var calculations = _.map(this.props.data, (d) => d.calculation);
      this.setSources(calculations);
    }

    render() {
      if (_.find(this.props.data, (p) => p.error)) {
        return this.renderMsg(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          { Text.ChartFetchError }
        </span>);
      }

      if (_.find(this.props.data, (p) => p.fetching)) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartFetching }
        </span>);
      }

      var results = _.map(this.props.data, (d) =>
       d.calculation
        .getResults()
        .flatMap((r) => Option.wrap({
          period: d.period,
          current: d.current,
          none: r.none,
          some: r.some
        })));
      if (_.find(results, (r) => r.isNone())) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartCalculating }
        </span>);
      }

      var data = Option.flatten(results);
      if (_.every(data, (d) =>
        _.isEmpty(d.none.annotations) && _.isEmpty(d.some)
      )) {
        return this.renderMsg(Text.ChartNoData)
      }

      return this.renderMain(data);
    }

    renderMsg(elm: JSX.Element|string) {
      return <div className="esper-expanded esper-no-content">
        <div className="panel-body">
          {elm}
        </div>
      </div>;
    }

    abstract renderMain(data: Charting.PeriodGroup[]): JSX.Element;
  }
}
