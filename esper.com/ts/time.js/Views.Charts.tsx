/*
  View for all of the charts
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="../lib/Components.DropdownModal.tsx" />
/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="../lib/Stores.Calendars.ts" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.IntervalSelector.tsx" />
/// <reference path="./Components.SidebarWithToggle.tsx" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Colors.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface ChartTypeInfo {
    // Used in URL to identify which chart we're looking at
    id: string;

    // Display Name
    displayAs: string;
    icon: string;
  }

  interface Props {
    currentChart: Esper.Charts.DefaultEventChart;
    chartTypes: Actions.ChartTypeInfo[];
  }

  /* React Views */

  export class Charts extends Component<Props, {}> {
    renderWithData() {
      var chart = this.props.currentChart;
      chart.sync(); // Call once per renderWithData to update chart data

      var teams = Stores.Teams.all();
      var calendarsByTeamId = Stores.Calendars.byTeamId();

      // Render view
      return <div id="charts-page" className="esper-full-screen minus-nav">
        <Components.SidebarWithToggle>
          <a className="pull-right" onClick={() => this.refresh()}>
            <i className="fa fa-fw fa-refresh" title="refresh" />
          </a>
          { this.renderChartSelector() }
          <div className="esper-menu-section">
            <label htmlFor={this.getId("cal-select")}>
              <i className="fa fa-fw fa-calendar-o" />{" "}
              Calendars
            </label>
            <Components.CalSelectorDropdown
              id={this.getId("cal-select")}
              teams={teams}
              calendarsByTeamId={calendarsByTeamId}
              selected={chart.params.cals}
              updateFn={(c) => this.updateCalSelection(c)}
              allowMulti={true}
            />
          </div>
          { chart ? chart.renderSelectors() : null }
        </Components.SidebarWithToggle>
        <div className="esper-right-content padded">
          { this.renderPeriodSelector() }
          { this.renderChartCheck() }
        </div>
      </div>;
    }

    renderChartSelector() {
      var selected = this.getCurrentChartInfo();
      return (<div className="esper-menu-section">
        <label htmlFor={this.getId("chart-type")}>
          <i className="fa fa-fw fa-bar-chart" />{" "}
          Chart Type{" "}
          <a className="text-muted" href="/help-charts"
             target="_blank">
            <i className="fa fa-fw fa-question-circle" />
          </a>
        </label>
        <Components.DropdownModal>
          <Components.Selector id={this.getId("chart-type")}
                               className="dropdown-toggle end-of-group">
            <i className={"fa fa-fw " + selected.icon} />{" "}
            { selected.displayAs }
          </Components.Selector>
          <ul className="dropdown-menu">
            {
              _.map(this.props.chartTypes, (c, i) =>
                <li key={i} onClick={() => this.updateChartType(c.id)}>
                  <a>
                    { c.icon ? <span>
                        <span className={"fa fa-fw " + c.icon} />{" "}
                      </span> : null
                    }
                    { c.displayAs }
                  </a>
                </li>
              )
            }
          </ul>
        </Components.DropdownModal>
      </div>);
    }

    renderPeriodSelector() {
      var period = this.props.currentChart.params.period;
      return <div className={"esper-content-header period-selector " +
                             "row fixed clearfix"}>
        <Components.IntervalOrCustomSelector
          className="col-sm-6"
          period={period}
          show={this.props.currentChart.intervalsAllowed()}
          updateFn={(p) => this.updatePeriod(p)}
        />
        <div className="col-sm-6">
          <Components.SingleOrCustomPeriodSelector
            period={period}
            updateFn={(p) => this.updatePeriod(p)}
          />
        </div>
      </div>;
    }

    /*
      Render any messages as appropriate in lieu of displaying chart, else
      display chart
    */
    renderChartCheck() {
      var chart = this.props.currentChart;
      if (!chart || !chart.params.cals.length) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar.
        </span>);
      }

      else if (chart.hasError()) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          Error loading data
        </span>);
      }

      else if (chart.isBusy()) {
        return <div className="esper-center">
          <span className="esper-spinner esper-large" />
        </div>;
      }

      else if (chart.noData()) {
        return this.renderMessage(chart.noDataMsg());
      }

      var totals = chart.getTotals();
      return <div className="chart-content">
        {
          totals && totals.length ?
          <Components.TotalsBar periodTotals={totals} /> :
          null
        }
        { chart.renderChart() }
      </div>;
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className={"esper-expanded padded panel panel-default " +
                             "esper-no-content"}>
        <div className="panel-body">
          {elm}
        </div>
      </div>;
    }


    /* Helpers */

    getCurrentChartInfo() {
      return Option.wrap(
        _.find(this.props.chartTypes,
          (ct) => this.props.currentChart.params.chartId === ct.id
        )
      ).match({
        none: () => this.props.chartTypes[0],
        some: (info) => info
      });
    }


    /* Actions */

    refresh() {
      Events2.invalidate();
      Route.nav.refresh();
    }

    updateRoute({chartId, cals, period, opts}: {
      chartId?: string;
      cals?: Stores.Calendars.CalSelection[];
      period?: Period.Single|Period.Custom;
      opts?: Route.nav.Opts;
    }) {
      var chart = this.props.currentChart;
      chartId = chartId || chart.params.chartId;
      cals    = cals    || chart.params.cals;
      period  = period  || chart.params.period;

      // Assume at most one team, maybe multiple calendars
      var pathForCals = Params.pathForCals(cals);

      opts = opts || {};
      opts.jsonQuery = chart.params.filterParams;

      var periodStr = Period.isCustom(period) ?
        [period.start, period.end].join(Params.PERIOD_SEPARATOR) :
        period.index.toString();

      Route.nav.path([
        "charts",
        chartId,
        pathForCals[0],
        pathForCals[1],
        period.interval[0],
        periodStr
      ], opts);
    }

    updateChartType(val: string) {
      this.updateRoute({
        chartId: val
      });
    }

    updateCalSelection(selections: Stores.Calendars.CalSelection[]) {
      this.updateRoute({
        cals: selections
      });
    }

    updatePeriod(period: Period.Single|Period.Custom) {
      this.updateRoute({
        period: period
      });
    }
  }
}
