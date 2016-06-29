/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class GuestHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventSeries(groups, {
        colorFn: (k) => Colors.getColorForDomain(k.split('@')[1] || k),
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <AbsoluteChart
          orientation="horizontal"
          series={series}
          categories={keys}
          yAxis={`${Text.ChartGuests} (${Text.hours()})`}
        />
      </div>;
    }
  }


  export class GuestPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <GuestPercentDrilldownChart groups={groups} />
      </div>;
    }
  }

  /*
    Guest colors in pie chart are lightened versions of a base color. This
    value is the maximum percentage to lighten any given slice.
  */
  const MAX_COLOR_CHANGE = 0.7;

  // This is the maximum to lighten any slice relative to the previous one
  const MAX_COLOR_DELTA = 0.3;

  class GuestPercentDrilldownChart extends ReactHelpers.Component<{
    groups: Charting.PeriodOptGroup[]
  }, {
    subgroup?: string[];
  }> {
    constructor(props: { groups: Charting.PeriodOptGroup[] }) {
      super(props);
      this.state = {};
    }

    render() {
      var series = Charting.eventGroupSeries(this.props.groups, {
        colorFn: (key, pos) => this.colorFn(key, pos),
        noneName: Text.NoGuests,
        yFn: EventStats.toHours,
        subgroup: this.state.subgroup,
        onDrilldown: (subgroup: string[]) => this.setState({
          subgroup: subgroup
        })
      });

      return <div className="chart-holder-parent">
        <PercentageChart
          series={series}
          yAxis={`${Text.ChartGuests} (${Text.ChartPercentage})`}
        />
        {
          _.isEmpty(this.state.subgroup) ? null :
          <button type="button"
                  onClick={() => this.drillUp()}
                  className="btn btn-default highchart-drillup">
            <i className="fa fa-fw fa-angle-left" />
          </button>
        }
      </div>;
    }

    colorFn(emailOrDomain: string, pos?: {index: number, total: number}) {
      var domain = emailOrDomain.split('@')[1] || emailOrDomain;
      var color = Colors.getColorForDomain(domain);
      if (pos.total > 1) {
        var colorStep = Math.min(
          MAX_COLOR_CHANGE / (pos.total - 1),
          MAX_COLOR_DELTA);
        color = Colors.lighten(color, pos.index * colorStep);
      }
      return color;
    }

    drillUp() {
      if (this.state.subgroup) {
        var up = this.state.subgroup.slice(0, this.state.subgroup.length - 1);
        this.setState({
          subgroup: up
        })
      }
    }
  }


  export class DomainEventGrid extends EventGrid<{}> {
    colorFn(groups: Option.T<string[]>) {
      return groups.match({
        none: () => Colors.lightGray,
        some: (g) => g[0] ? Colors.getColorForDomain(g[0]) : Colors.gray,
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return groups.match({
        none: () => "",
        some: (g) => g[0] || Text.NoGuests
      });
    }
  }
}
