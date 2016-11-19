/*
  Base class for chart - takes a set of calculations and renders once they're
  done. Renders intermediate states like fetching and calculating.
*/
module Esper.Components {

  export abstract class Chart<R, P> extends ReactHelpers.Component<P, {}> {
    _calc: Calc<R>;

    abstract getCalc(props: P): Calc<R>;

    // Wrap in case this._calc is not set yet
    getResult(): Option.T<R> {
      return Option.wrap(this._calc).flatMap((r) => r.getOutput());
    }

    componentWillMount() {
      this.setCalcSources(this.props);
    }

    componentWillUpdate(nextProps: P) {
      if (this.props !== nextProps && this.shouldCalcUpdate(nextProps)) {
        this.setCalcSources(nextProps);
      }
    }

    // Override in where we might want to update component but keep same calc
    shouldCalcUpdate(nextProps: P) {
      return true;
    }

    setCalcSources(props: P) {
      this._calc = this.getCalc(props);

      /*
        We normally do this sort of thing after mounting / updating to avoid
        issues with emitter firing prior or during rendering, but calc
        shouldn't start until next frame at least, so probably OK.
      */
      this.setSources([this._calc]);
    }
  }


  /* Variant of Chart that shows data state */
  export abstract class DataChart<R, P> extends Chart<R, P & Types.HasStatus> {
    render() {
      if (this.props.hasError) {
        return <ChartMsg>
          <i className="fa fa-fw fa-left fa-warning"></i>
          <span>{ Text.ChartFetchError }</span>
        </ChartMsg>;
      }

      if (this.props.isBusy) {
        return <ChartMsg>
          <span className="esper-spinner" />
          <span>{ Text.ChartFetching }</span>
        </ChartMsg>;
      }

      return this.getResult().mapOr(
        <ChartMsg>
          <span className="esper-spinner" />
          <span>{ Text.ChartCalculating }</span>
        </ChartMsg>,

        (r) => this.renderResult(r)
      );
    }

    abstract renderResult(r: R): JSX.Element;
  }

  export function ChartMsg({children}: {
    children?: string|JSX.Element|JSX.Element[]
  }) {
    return <div className="esper-no-content">
      <span>{children}</span>
    </div>;
  }


  /* Variant of chart for actual chart attributes in charting library */
  export abstract class GroupDurationChart
         extends DataChart<Types.GroupState, Types.ChartProps> {
    getCalc(props: Types.ChartProps): Calc<Types.GroupState> {
      return EventStats.defaultGroupDurationCalc(
        props.eventsForRanges,
        Charting.getFilterFns(props),
        (e) => props.groupBy.keyFn(e, props),
        props.extra.weekHours
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

  // Shows duration percentages by group for a single time period
  export class PieDurationChart extends GroupDurationChart {
    renderResult(result: Types.GroupState) {
      if (result.group.all.totalUnique === 0) {
        return <ChartMsg>{Text.ChartNoData}</ChartMsg>;
      }

      let { team, groupBy, simplified } = this.props;
      let series = Charting.singleGroupSeries(result.group, this.props, {
        yFn: EventStats.toHours,
        totals: this.props.extra.incUnscheduled ?
          _.map(result.group.all.values,
            (v) => WeekHours.totalForRange(v.range, this.props.extra.weekHours)
          ) : undefined
      });
      let altExport = function() {
        var subscription = team.team_api.team_subscription;
        if (Config.disableAdvancedFeatures(subscription.plan)) {
          Actions.Charts.renderPlanUpgradeModal(subscription.cusid);
          return false;
        }
        return true;
      };

      // Hide 0s in pie chart (avoids phantom labels)
      series.data = _.filter(series.data, (d) => d.y > 0);

      return <div className="chart-content">
        { simplified ? null : <TotalsBar {...result.group.all} /> }
        <PieChart
          { ... { altExport, simplified, series } }
          yAxis={`${groupBy.name} (${Text.ChartPercentUnit})`}
        />
      </div>;
    }
  }

  // Shows duration with each event segmented out
  export class BarDurationChart extends GroupDurationChart {
    renderResult(result: Types.GroupState) {
      if (result.group.all.totalUnique === 0) {
        return <ChartMsg>{Text.ChartNoData}</ChartMsg>;
      }

      let { team, groupBy, simplified } = this.props;
      let { categories, series } = Charting.eventSeries(
        result.group, this.props, {
          yFn: EventStats.toHours
        });
      let altExport = function() {
        var subscription = team.team_api.team_subscription;
        if (Config.disableAdvancedFeatures(subscription.plan)) {
          Actions.Charts.renderPlanUpgradeModal(subscription.cusid);
          return false;
        }
        return true;
      };

      return <div className="chart-content">
        { simplified ? null : <TotalsBar {...result.group.all} /> }
        <BarChart
          { ... { altExport, simplified, categories, series }}
          yAxis={`${groupBy.name} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }

  export class StackedBarDurationChart extends GroupDurationChart {
    renderResult(result: Types.GroupState) {
      if (result.group.all.totalUnique === 0) {
        return <ChartMsg>{Text.ChartNoData}</ChartMsg>;
      }

      let { team, groupBy, simplified } = this.props;
      let series = Charting.eventGroupSeries(result.group, this.props, {
        yFn: EventStats.toHours,
        totals: this.props.extra.incUnscheduled ?
          _.map(result.group.all.values,
            (v) => WeekHours.totalForRange(v.range, this.props.extra.weekHours)
          ) : undefined
      });
      let categories = Text.fmtPeriodList(this.props.period);
      let altExport = function() {
        var subscription = team.team_api.team_subscription;
        if (Config.disableAdvancedFeatures(subscription.plan)) {
          Actions.Charts.renderPlanUpgradeModal(subscription.cusid);
          return false;
        }
        return true;
      };

      return <div className="chart-content">
        <StackedBarChart
          { ... { altExport, simplified, series, categories }}
          yAxis={`${groupBy.name} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }

  export class LineDurationChart extends GroupDurationChart {
    renderResult(result: Types.GroupState) {
      if (result.group.all.totalUnique === 0) {
        return <ChartMsg>{Text.ChartNoData}</ChartMsg>;
      }

      let { team, groupBy, simplified } = this.props;
      let series = Charting.eventGroupSeries(result.group, this.props, {
        yFn: EventStats.toHours
      });
      let categories = Text.fmtPeriodList(this.props.period);
      let altExport = function() {
        var subscription = team.team_api.team_subscription;
        if (Config.disableAdvancedFeatures(subscription.plan)) {
          Actions.Charts.renderPlanUpgradeModal(subscription.cusid);
          return false;
        }
        return true;
      };

      return <div className="chart-content">
        <LineChart
          { ... { altExport, simplified, series, categories }}
          yAxis={`${groupBy.name} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }
}


