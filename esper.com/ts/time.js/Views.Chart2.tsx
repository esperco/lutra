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

  type SidebarVals = "main"|"filter"|"events";

  interface State {
    sidebar: SidebarVals
  }

  export class Charts2 extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        sidebar: "main"
      };
    }

    renderWithData() {
      return <div id="charts-page" className="esper-full-screen minus-nav">
        <Components.SidebarWithToggle>
          <div className="sidebar-top-menu">
            <div className="esper-tab-menu">
              { this.renderSidebarTab("main",
                  <i className="fa fa-fw fa-home" />
              ) }
              { this.renderSidebarTab("filter",
                  <i className="fa fa-fw fa-sliders" />
              ) }
              { this.renderSidebarTab("events",
                  <span className="badge">
                    123
                  </span>
              ) }
            </div>
          </div>

          { this.renderSidebarContent() }

          <div className="sidebar-bottom-menu">
            <div className="team-selector">
              <i className="fa fa-fw fa-caret-up" />{" "}
              Team
            </div>
          </div>
        </Components.SidebarWithToggle>
        <div className="esper-right-content">
          { this.renderPeriodSelector() }
          { this.props.chart }
        </div>
      </div>;
    }

    renderSidebarTab(val: SidebarVals, elm: JSX.Element) {
      return <a className={classNames("esper-tab", {
        active: this.state.sidebar === val
      })} onClick={() => this.setState({ sidebar: val })}>
        { elm }
      </a>
    }

    renderSidebarContent() {
      if (this.state.sidebar === "main") {
        return this.renderSidebarMain();
      }
      return this.renderSidebarFilters();
    }

    renderSidebarMain() {
      return <div className="sidebar-minus-top-menu sidebar-minus-bottom-menu">
        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.labelsChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartLabels,
          icon: "fa-tags"
        }) }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.guestChart,
          extra: {
            type: "absolute",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartGuests,
          icon: "fa-users"
        }) }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.durationChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartDuration,
          icon: "fa-clock-o"
        }) }
      </div>;
    }

    renderSidebarMenuOpt({pathFn, extra, header, icon, elm}: {
      pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path;
      extra?: Actions.Charts2.ExtraOpts;
      header: string;
      icon?: string;
      elm?: JSX.Element|string;
    }) {
      var active = pathFn === this.props.pathFn;
      return <div className="esper-panel-section action-block"
        onClick={() => this.updateRoute({
          pathFn: pathFn,
          extra: extra
        })}>
        <div className={classNames("esper-subheader-link", {
          active: active
        })}>
          <i className={"fa fa-fw " + icon} />{" "}
          { header }
        </div>
        <div className="">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur a
          iaculis odio. Nulla blandit euismod imperdiet. Phasellus facilisis
          purus odio, vitae porta ante ullamcorper at.
        </div>
      </div>;
    }

    renderSidebarFilters() {
      var team = Stores.Teams.require(this.props.teamId);
      var calendars = Option.matchList(
        Stores.Calendars.list(this.props.teamId)
      );
      return <div className="sidebar-minus-top-menu sidebar-minus-bottom-menu">
        <div className="esper-panel-section">
          <div className="btn-group btn-group-justified">
            <div className="btn-group">
              { this.renderTypeButton("percent") }
            </div>
            <div className="btn-group">
              { this.renderTypeButton("absolute") }
            </div>
          </div>
        </div>

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
      </div>;
    }

    renderTypeButton(type: "percent"|"absolute") {
      var [title, icon] = type === "percent" ?
        [Text.ChartPercentage, "fa-pie-chart"] :
        [Text.ChartAbsolute, "fa-bar-chart"]

      return <button className={classNames("btn btn-default", {
        active: type === this.props.extra.type
      })} onClick={() => this.updateExtra({ type: type })}>
        <Components.Tooltip title={title} placement="bottom">
          <i style={{width: "100%"}} className={"fa fa-fw " + icon} />
        </Components.Tooltip>
      </button>
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

    updateRoute({pathFn, teamId, calIds, period, extra, opts={}}: {
      pathFn?: (o: Paths.Time.chartPathOpts) => Paths.Path;
      teamId?: string;
      calIds?: string[];
      period?: Period.Single|Period.Custom;
      extra?: Actions.Charts2.ExtraOpts;
      opts?: Route.nav.Opts;
    }) {
      pathFn = pathFn || this.props.pathFn;
      teamId = teamId || this.props.teamId;
      calIds = calIds || this.props.calIds;
      period = period || this.props.period;

      // Chart change => blank out filter params unless provided
      if (pathFn !== this.props.pathFn && extra) {
        opts.jsonQuery = extra;
      }

      // Preserve params only if same team change
      else if (teamId === this.props.teamId) {
        opts.jsonQuery = _.extend({}, this.props.extra, extra)
      }

      else {
        opts.jsonQuery = {};
      }

      var periodStr = Period.isCustom(period) ?
        [period.start, period.end].join(Params.PERIOD_SEPARATOR) :
        period.index.toString();

      Route.nav.path(pathFn({
        teamId: teamId,
        calIds: Params.pathForCalIds(calIds),
        interval: period.interval[0],
        period: periodStr
      }), opts);
    }
  }
}
