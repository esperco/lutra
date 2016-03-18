/*
  View for all of the charts
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/AB.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Components.DropdownModal.tsx" />
/// <reference path="./Components.CalSelector.tsx" />
/// <reference path="./Components.IntervalRangeSelector.tsx" />
/// <reference path="./Components.SidebarWithToggle.tsx" />
/// <reference path="./Charts.ActivityGrid.tsx" />
/// <reference path="./Charts.DurationsOverTime.tsx" />
/// <reference path="./Charts.PercentageRecent.tsx" />
/// <reference path="./Charts.PercentageOverTime.tsx" />
/// <reference path="./Charts.GuestDomains.tsx" />
/// <reference path="./Charts.TopGuests.tsx" />
/// <reference path="./Charts.WorkHoursGrid.tsx" />
/// <reference path="./Charts.DurationHistogram.tsx" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  type ChartType = typeof Esper.Charts.Chart;
  interface ChartTypeInfo {
    // Used in URL to identify which chart we're looking at
    id: string;

    // Display Name
    displayAs: string;
    icon: string;

    // Actual chart Object
    chartType: ChartType;
  }

  interface Props {
    currentChart: Esper.Charts.Chart<Esper.Charts.ChartJSON>;
    chartId: Actions.ChartId;
    chartTypes: Actions.ChartTypeInfo[];
  }

  /* React Views */

  export class Charts extends Component<Props, {}> {
    renderWithData() {
      var chart = this.props.currentChart;
      var teams = Teams.all();
      var calendarsByTeamId = (() => {
        var ret: {[index: string]: ApiT.GenericCalendar[]} = {};
        _.each(Teams.all(), (t) => {
          ret[t.teamid] = Calendars.CalendarListStore.val(t.teamid)
        });
        return ret;
      })();

      // Render view
      return <div id="charts-page"
                  className="esper-full-screen minus-nav">
        <Components.SidebarWithToggle>
          <div className="esper-menu-section">
            <label htmlFor={this.getId("cal-select")}>
              <i className="fa fa-fw fa-calendar-o" />{" "}
              Calendar
            </label>
            <Components.CalSelectorDropdown
              id={this.getId("cal-select")}
              teams={teams}
              calendarsByTeamId={calendarsByTeamId}
              selected={chart.params.cals}
              updateFn={(c) => this.updateCalSelection(c)}
            />
          </div>
          { chart ? chart.renderSelectors() : null }
        </Components.SidebarWithToggle>
        <div className="esper-right-content padded">
          <div className="esper-header fixed row clearfix">
            <div className="col-xs-8 col-sm-4">
              { this.renderChartSelector() }
            </div>
            <div className="col-xs-4 col-sm-2 clearfix">
              <div className="pull-left">
                <a className="esper-subtle" href="/help-charts"
                   target="_blank">
                  <i className="fa fa-fw fa-question-circle" />
                </a>
              </div>
              <div className="pull-right">
                <button className="btn btn-default"
                        onClick={() => this.refresh()}>
                  <i className="fa fa-fw fa-refresh" title="refresh" />
                </button>
              </div>
            </div>
            <div className="col-xs-12 col-sm-6">
              { chart ? this.renderPeriodSelector() : null }
            </div>
          </div>
          { this.renderChartCheck() }
        </div>
      </div>;
    }

    renderChartSelector() {
      var selected = this.getCurrentChartInfo();
      return (
        <Components.DropdownModal>
          <input type="text" className="form-control dropdown-toggle"
                 readOnly={true}
                 value={ selected.displayAs } />
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
        </Components.DropdownModal>);
    }

    renderPeriodSelector() {
      return this.props.currentChart.renderPeriodSelector();
    }

    /*
      Render any messages as appropriate in lieu of displaying chart, else
      display chart
    */
    renderChartCheck() {
      var chart = this.props.currentChart;
      if (! chart) {
        return this.renderMessage(<span>
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Please select a calendar.
        </span>);
      }

      else if (chart.getError()) {
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

      return chart.renderChart();
    }

    renderMessage(elm: JSX.Element|string) {
      return <div className="esper-expanded minus-subheader padded">
        <div className="panel panel-default esper-focus-message">
          <div className="panel-body">
            {elm}
          </div>
        </div>
      </div>;
    }


    /* Helpers */

    getCurrentChartInfo() {
      return Option.wrap(
        _.find(this.props.chartTypes,
          (ct) => this.props.chartId === ct.id
        )
      ).match({
        none: () => this.props.chartTypes[0],
        some: (info) => info
      });
    }


    /* Actions */

    refresh() {
      TimeStats.StatStore.reset();
      DailyStats.StatStore.reset();
      Route.nav.refresh();
    }

    updateRoute<T extends Esper.Charts.ChartJSON>(
      {chartTypeId, props, opts}: {
        chartTypeId?: string;
        props?: T;
        opts?: Route.nav.Opts;
      })
    {
      chartTypeId = chartTypeId || this.getCurrentChartInfo().id;
      var frag = "/charts/" + chartTypeId;

      opts = opts || {};
      opts.jsonQuery = props;
      Route.nav.path(frag, opts);
    }

    updateChartType(val: string) {
      this.updateRoute({
        chartTypeId: val,
        props: this.props.currentChart.params
      });
    }

    updateCalSelection(selections: Calendars.CalSelection[]) {
      this.updateRoute({
        props: this.extendCurrentProps({
          cals: selections
        })
      });
    }

    extendCurrentProps(newParams: Esper.Charts.ChartJSON)
      : Esper.Charts.ChartJSON
    {
      return _.extend({}, this.props.currentChart.params, newParams);
    }
  }
}
