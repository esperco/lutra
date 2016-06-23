/*
  View for all of the chart pages
*/

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Props {
    teamId: string;
    calIds: string[];
    period: Period.Single|Period.Custom;
    intervalsAllowed?: Period.IntervalOrCustom[];
    extra: Actions.Charts2.ExtraOpts;

    pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path;
    chart: JSX.Element;
    selectors?: JSX.Element|JSX.Element[];
  }

  export class Charts2 extends Component<Props, {}> {
    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      var calendars = Option.matchList(
        Stores.Calendars.list(this.props.teamId)
      );

      return <div id="charts-page" className="esper-full-screen minus-nav">
        <Components.SidebarWithToggle>
          <div className="esper-panel-section">
            <label htmlFor={this.getId("cal-select")}>
              <i className="fa fa-fw fa-calendar-o" />{" "}
              Calendars
            </label>
            <Components.CalSelectorDropdown
              id={this.getId("cal-select")}
              teams={[team]}
              calendarsByTeamId={Util.keyObj(team.teamid, calendars)}
              selected={_.map(this.props.calIds, (calId) => ({
                teamId: team.teamid,
                calId: calId
              }))}
              updateFn={(c) => this.updateCalSelection(c)}
              allowMulti={true}
            />
          </div>

          <div className="esper-panel-section">
            <div className="esper-subheader">
              <i className="fa fa-fw fa-clock-o" />{" "}
              Compare With
            </div>
            <Components.RelativePeriodSelector
              period={this.props.period}
              allowedIncrs={[-1, 1]}
              selectedIncrs={this.props.extra.incrs}
              updateFn={(x) => this.updateIncrs(x)}
            />
          </div>

          { this.props.selectors }

        </Components.SidebarWithToggle>
        <div className="esper-right-content">
          { this.renderPeriodSelector() }
          { this.props.chart }
        </div>
      </div>;
    }

    renderPeriodSelector() {
      return <div className={"esper-content-header period-selector " +
                             "row fixed clearfix"}>
        <Components.IntervalOrCustomSelector
          className="col-sm-6"
          period={this.props.period}
          show={this.props.intervalsAllowed}
          updateFn={(p) => this.updatePeriod(p)}
        />
        <div className="col-sm-6">
          <Components.SingleOrCustomPeriodSelector
            period={this.props.period}
            updateFn={(p) => this.updatePeriod(p)}
          />
        </div>
      </div>;
    }

    updatePeriod(period: Period.Single|Period.Custom) {
      this.updateRoute({
        period: period
      });
    }

    updateIncrs(incrs: number[]) {
      if (! _.includes(incrs, 0)) {
        incrs.push(0);
      }
      this.updateExtra({ incrs: incrs });
    }

    updateExtra(extra: {
      type?: "percent"|"absolute";
      incrs?: number[]
    }) {
      this.updateRoute({
        extra: {
          type: extra.type || this.props.extra.type,
          incrs: extra.incrs || this.props.extra.incrs
        }
      });
    }

    updateCalSelection(selections: Stores.Calendars.CalSelection[]) {
      this.updateRoute({
        teamId: selections[0] && selections[0].teamId,
        calIds: _.map(selections, (s) => s.calId)
      });
    }

    updateRoute({teamId, calIds, period, extra, opts}: {
      teamId?: string;
      calIds?: string[];
      period?: Period.Single|Period.Custom;
      extra?: Actions.Charts2.ExtraOpts;
      opts?: Route.nav.Opts;
    }) {
      teamId = teamId || this.props.teamId;
      calIds = calIds || this.props.calIds;
      period = period || this.props.period;
      extra = _.extend({}, this.props.extra, extra) as
        Actions.Charts2.ExtraOpts;
      opts = opts || {};

      // Team change => blank out filter params, else preserve
      opts.jsonQuery = teamId === this.props.teamId ? extra : {};

      var periodStr = Period.isCustom(period) ?
        [period.start, period.end].join(Params.PERIOD_SEPARATOR) :
        period.index.toString();

      Route.nav.path(this.props.pathFn({
        teamId: teamId,
        calIds: Params.pathForCalIds(calIds),
        interval: period.interval[0],
        period: periodStr
      }), opts);
    }
  }
}
