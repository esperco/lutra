/*
  Base class for chart - takes a set of calculations and renders once they're
  done. Renders intermediate states like fetching and calculating.
*/
module Esper.Components {

  interface Props<T> {
    // Data is a list because we have calculation for each period
    data: {
      period: Period.Single|Period.Custom;
      current: boolean; // Is this "active" period or a comparative period?
      calculation: EventStats.CalcBase<T, any>;
      fetching: boolean;
      error: boolean;
    }[];
  }

  export abstract class Chart<T extends EventStats.OptGrouping, U>
         extends ReactHelpers.Component<Props<T> & U, {}> {

    /*
      Only update if props or underlying events changed. This is a relatively
      expensive check to do but is less annoying than rendering the chart
      multiple times.
    */
    shouldComponentUpdate(newProps: Props<T> & U) {
      // Different periods => update
      if (newProps.data.length !== this.props.data.length) {
        return true;
      }

      // Else compare each period, and make sure calculations don't
      for (let i in newProps.data) {
        let newData = newProps.data[i];
        let oldData = this.props.data[i];
        let isEqual = _.isEqual(newData.period, oldData.period) &&
          newData.current === oldData.current &&
          newData.fetching === oldData.fetching &&
          newData.error === oldData.error &&
          newData.calculation.eq(oldData.calculation);
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
      var calculations = _.map(this.props.data, (d) => d.calculation);
      if (_.every(calculations, (c) => c.ready)) {
        this.setSources([]);
      } else {
        this.setSources(calculations);
      }
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
          data: r
        })));
      if (_.find(results, (r) => r.isNone())) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartCalculating }
        </span>);
      }

      var data = Option.flatten(results);
      if (_.every(data, (d) =>
        _.isEmpty(d.data.none.annotations) && _.isEmpty(d.data.some)
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

    abstract renderMain(data: Charting.PeriodData<T>[]): JSX.Element;
  }

  /*
    Default chart option for group data and nothing more
  */
  export abstract class DefaultGroupingChart<T>
    extends Chart<EventStats.OptGrouping, T> {}

  export abstract class DefaultChart extends DefaultGroupingChart<{}> {}
}
