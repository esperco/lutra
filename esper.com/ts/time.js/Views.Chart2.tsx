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
    extra: Actions.Charts2.ExtraOpts;

    pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path;
    chart: JSX.Element;
    selectors?: JSX.Element|JSX.Element[];

    // Other sidebar menus
    menus?: {
      id: string;
      tab: JSX.Element;
      content?: JSX.Element|JSX.Element[];
      onClick?: () => boolean; // Return false to avoid switching state
    }[];
  }

  const SidebarMain = "main";
  const SidebarFilter = "filter";

  interface State {
    sidebar: string;
  }

  export class Charts2 extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        sidebar: SidebarMain
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
              { _.map(this.props.menus,
                (m) => this.renderSidebarTab(m.id, m.tab, m.onClick)
              ) }
            </div>
          </div>

          { this.renderSidebarContent() }

          <div className="sidebar-bottom-menu">
            <Components.TeamSelector
              teams={Stores.Teams.all()}
              selectedId={this.props.teamId}
              onUpdate={(teamId) => this.updateRoute({teamId: teamId})} />
          </div>
        </Components.SidebarWithToggle>
        <div className="esper-right-content">
          { this.renderPeriodSelector() }
          { this.props.chart }
        </div>
      </div>;
    }

    renderSidebarTab(val: string, elm: JSX.Element, onClick?: () => boolean) {
      return <a key={val}
        className={classNames("esper-tab", {
          active: this.state.sidebar === val
        })}
        onClick={() => (onClick ? onClick() : true) &&
                 this.setState({ sidebar: val })}>
        { elm }
      </a>
    }

    renderSidebarContent() {
      if (this.state.sidebar === SidebarFilter) {
        return this.renderSidebarFilters();
      }

      var menu = _.find(this.props.menus, (m) => m.id === this.state.sidebar);
      if (menu) {
        return menu.content;
      }

      return this.renderSidebarMain();
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
          content: Text.ChartLabelsDescription,
          icon: "fa-tags"
        }) }

        { this.props.calIds.length > 1 ? this.renderSidebarMenuOpt({
          pathFn: Paths.Time.calendarsChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartCalendars,
          content: Text.ChartCalendarsDescription,
          icon: "fa-calendar-o"
        }) : null }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.guestsChart,
          extra: {
            type: "absolute",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartGuests,
          content: Text.ChartGuestsDescription,
          icon: "fa-user"
        }) }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.ratingsChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartRatings,
          content: Text.ChartRatingsDescription,
          icon: "fa-star"
        }) }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.durationsChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartDuration,
          content: Text.ChartDurationDescription,
          icon: "fa-clock-o"
        }) }

        { this.renderSidebarMenuOpt({
          pathFn: Paths.Time.guestsCountChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartGuestsCount,
          content: Text.ChartGuestsCountDescription,
          icon: "fa-users"
        }) }
      </div>;
    }

    renderSidebarMenuOpt({pathFn, extra, header, icon, content}: {
      pathFn: (o: Paths.Time.chartPathOpts) => Paths.Path;
      extra?: Actions.Charts2.ExtraOpts;
      header: string;
      icon?: string;
      content?: JSX.Element|string;
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
          { icon ? <i className={"fa fa-fw " + icon} /> : null }{" "}
          { header }
        </div>
        { content }
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
              { this.renderTypeButton("percent",
                                      Text.ChartPercentage,
                                      "fa-pie-chart") }
            </div>
            <div className="btn-group">
              { this.renderTypeButton("absolute",
                                      Text.ChartAbsolute,
                                      "fa-bar-chart") }
            </div>
            <div className="btn-group">
              { this.renderTypeButton("calendar",
                                      Text.ChartGrid,
                                      "fa-calendar") }
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

        { this.props.extra.type === "calendar" ? null :
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
        }
        { this.props.selectors }
      </div>;
    }

    renderTypeButton(
        type: Charting.ChartType,
        title: string, icon: string) {

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
          show={this.props.extra.type === "calendar" ? ["month"] : undefined}
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
      type?: Charting.ChartType;
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

      // Preserve params only if same team change. Also switch cals.
      else if (teamId !== this.props.teamId) {
        calIds = [Params.defaultCalIds];
        opts.jsonQuery = {};
      }

      else {
        opts.jsonQuery = _.extend({}, this.props.extra, extra)
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
