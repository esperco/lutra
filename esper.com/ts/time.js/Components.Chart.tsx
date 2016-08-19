/*
  Base class for chart - takes a set of calculations and renders once they're
  done. Renders intermediate states like fetching and calculating.
*/
module Esper.Components {

  interface Props<T> {
    simplified?: boolean; // Simplified version of chart for report

    // Data is a list because we have calculation for each period
    periods: (
      Types.PeriodData<EventStats.CalcBase<T, any>> & Types.HasStatus
    )[];
  }

  export abstract class Chart<T, U>
         extends ReactHelpers.Component<Props<T> & U, {}> {

    /*
      Only update if props or underlying events changed. This is a relatively
      expensive check to do but is less annoying than rendering the chart
      multiple times.
    */
    shouldComponentUpdate(newProps: Props<T> & U) {
      // Different periods => update
      if (newProps.periods.length !== this.props.periods.length) {
        return true;
      }

      // Else compare each period, and make sure calculations don't
      for (let i in newProps.periods) {
        let newPeriod = newProps.periods[i];
        let oldPeriod = this.props.periods[i];
        let isEqual = _.isEqual(newPeriod.period, oldPeriod.period) &&
          newPeriod.current === oldPeriod.current &&
          newPeriod.isBusy === oldPeriod.isBusy &&
          newPeriod.hasError === oldPeriod.hasError &&
          newPeriod.data.eq(oldPeriod.data);
        if (! isEqual) {
          return true;
        }
      }

      return false;
    }

    componentDidMount() {
      this.setCalcSources();
    }

    componentDidUpdate() {
      this.setCalcSources();
    }

    setCalcSources() {
      var calculations = _.map(this.props.periods, (d) => d.data);
      if (_.every(calculations, (c) => c.ready)) {
        this.setSources([]);
      } else {
        this.setSources(calculations);
      }
    }

    render() {
      if (_.find(this.props.periods, (p) => p.hasError)) {
        return this.renderMsg(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          { Text.ChartFetchError }
        </span>);
      }

      if (_.find(this.props.periods, (p) => p.isBusy)) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartFetching }
        </span>);
      }

      var results = _.map(this.props.periods, (p) =>
       p.data
        .getResults()
        .flatMap((r) => Option.wrap({
          period: p.period,
          current: p.current,
          total: p.total,
          isBusy: p.isBusy,
          hasError: p.hasError,
          data: r
        })));
      if (_.find(results, (r) => r.isNone())) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartCalculating }
        </span>);
      }

      var data = Option.flatten(results);
      if (_.every(data, (d) => this.noData(d.data))) {
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

    abstract noData(data: T): boolean;

    abstract renderMain(data: Charting.PeriodData<T>[])
      : JSX.Element;
  }

  /*
    Default chart option for group data
  */
  export abstract class DefaultGroupingChart<T>
    extends Chart<Types.EventOptGrouping, T> {

    noData(data: Types.EventOptGrouping) {
      return _.isEmpty(data.none.annotations) && _.isEmpty(data.some);
    }
  }

  export abstract class DefaultChart extends DefaultGroupingChart<{}> {}
}
