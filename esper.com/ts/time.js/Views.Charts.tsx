/*
  View for all of the chart pages
*/

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  type Props = Types.ChartProps;

  interface State {
    showFilterMenu?: boolean;
  }

  // Which filters are active?
  interface ActiveFilters {
    calendars: boolean;
    incUnscheduled: boolean;
    filterStr: boolean;
    domains: boolean;
    durations: boolean;
    labels: boolean;
    ratings: boolean;
    guestCounts: boolean;
    weekHours: boolean;
  }

  export class Charts extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {};
    }

    renderWithData() {
      let filterState = getFilterState(this.props);

      return <div id="charts-page" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
          { this.renderSidebarContent() }

          <div className="sidebar-bottom-menu">
            <Components.TeamSelector
              teams={Stores.Teams.all()}
              selectedId={this.props.team.teamid}
              onUpdate={(teamId) => this.updateTeamId(teamId)}
            />
          </div>
        </Components.Sidebar>

        <div className="esper-content">
          <div id="chart-header" className="esper-content-header">
            <Components.PeriodSelector
              period={this.props.period}
              range={_.includes([
                "absolute-series", "percent-series"
              ], this.props.extra.type)}
              updateFn={(p) => this.updatePeriod(p)}
            />
            <div className="actions">
              <div className="esper-flex-list">
                <div className="search-box-container">
                  <Components.SearchBox
                    icon="fa-search"
                    className="form-control"
                    placeholder={Text.SearchEventsPlaceholder}
                    value={this.props.extra.filterStr}
                    onUpdate={(val) => this.updateExtra({ filterStr: val })}
                  />
                </div>
                <span className="action filter-action"
                      onClick={() => this.toggleFilterMenu()}>
                  <i className={classNames("fa fa-fw", {
                    "fa-close": this.state.showFilterMenu,
                    "fa-ellipsis-v": !this.state.showFilterMenu,
                    "active": _.some(_.values(filterState)) &&
                              !this.state.showFilterMenu
                  })} />
                </span>
              </div>
            </div>
          </div>
          <div id="chart-expanded" className="esper-expanded">
            { this.state.showFilterMenu ?
              <FilterMenu props={this.props} active={filterState} /> : null }
            <ChartContent {...this.props} />
          </div>
        </div>
      </div>;
    }

    renderSidebarContent() {
      return <div className="sidebar-minus-bottom-menu">
        <div className="esper-panel-section">
          { this.renderChartSelector() }
        </div>

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
                                      "fa-align-left") }
            </div>
            <div className="btn-group">
              { this.renderTypeButton("percent-series",
                                      Text.ChartPercentageSeries,
                                      "fa-tasks fa-rotate-90") }
            </div>
            <div className="btn-group">
              { this.renderTypeButton("absolute-series",
                                      Text.ChartAbsoluteSeries,
                                      "fa-line-chart") }
            </div>
          </div>
        </div>

        <div className="esper-panel-section">
          <Components.ChartSelector
            {...this.props}
            updateFn={(extra) => this.updateExtra(extra)}
          />
        </div>
      </div>;
    }

    displayGroupBy(groupBy: Types.GroupBy) {
      return <span>
        { groupBy.icon ?
          <i className={"fa fa-fw fa-left " + groupBy.icon} /> : null }
        { groupBy.name }
      </span>
    }

    renderChartSelector() {
      let periodStr = Params.periodStr(this.props.period);
      return <div className="esper-flex-list">
        <a className="action" href={Paths.Time.report({
          teamId: this.props.team.teamid,
          period: periodStr.period,
          interval: periodStr.interval
        }).href}>
          <i className="fa fa-fw fa-left fa-arrow-left" />
        </a>

        <Components.Dropdown>
          <Components.Selector className="dropdown-toggle">
            { this.displayGroupBy(this.props.groupBy) }
          </Components.Selector>
          <ul className="dropdown-menu">
            { _.map([
              Charting.GroupByLabel,
              Charting.GroupByCalendar,
              Charting.GroupByDomain,
              Charting.GroupByGuest,
              Charting.GroupByRating,
              Charting.GroupByDuration,
              Charting.GroupByGuestCount
            ], (g, i) => <li key={i}>
              <a onClick={() => this.updateGroupBy(g)}>
                { this.displayGroupBy(g) }
              </a>
            </li>)}
          </ul>
        </Components.Dropdown>
      </div>
    }

    renderTypeButton(
        type: Types.ChartType,
        title: string, icon: string) {
      return <button className={classNames("btn btn-default", {
        active: type === this.props.extra.type
      })} onClick={() => this.updateExtra({ type: type })}>
        <Components.Tooltip title={title}>
          <i style={{width: "100%"}} className={"fa fa-fw " + icon} />
        </Components.Tooltip>
      </button>
    }

    toggleFilterMenu() {
      this.mutateState((s) => s.showFilterMenu = !s.showFilterMenu);
    }

    /* Action functions */

    updateGroupBy(groupBy: Types.GroupBy) {
      Charting.updateChart(this.props, { groupBy });
    }

    updatePeriod(period: Types.Period) {
      Charting.updateChart(this.props, { period });
    }

    updateTeamId(teamId: string) {
      Charting.updateChart(this.props, { teamId });
    }

    updateExtra(extra: Types.ChartExtraOpt) {
      Charting.updateChart(this.props, { extra });
    }
  }


  // Actual chart
  function ChartContent(props: Props) {
    switch(props.extra.type) {
      case "percent-series":
        return <Components.StackedBarDurationChart {...props} />;
      case "absolute-series":
        return <Components.LineDurationChart {...props} />;
      case "percent":
        return <Components.PieDurationChart {...props} />;
      default: // Absolute
        return <Components.BarDurationChart {...props} />;
    }
  }


  // Filters
  function FilterMenu({ props, active }: {
    props: Props,
    active: ActiveFilters
  }) {
    let idPrefix = Util.randomString();
    let anyActive = _.some(_.values(active));

    return <div className="filter-menu esper-section esper-shade">
      <div className="esper-section esper-flex-list">
        <FilterGroupBy
          props={props}
          active={active.labels}
          groupBy={Charting.GroupByLabel}
        />
        <FilterGroupBy
          props={props}
          active={active.calendars}
          groupBy={Charting.GroupByCalendar}
        />
        <FilterGroupBy
          props={props}
          active={active.domains}
          groupBy={Charting.GroupByDomain}
        />
        <FilterGroupBy
          props={props}
          active={active.durations}
          groupBy={Charting.GroupByDuration}
        />
        <FilterGroupBy
          props={props}
          active={active.guestCounts}
          groupBy={Charting.GroupByGuestCount}
        />
        <FilterGroupBy
          props={props}
          active={active.ratings}
          groupBy={Charting.GroupByRating}
        />

        <FilterItem id={idPrefix + "weekHours"}
                    active={active.weekHours || active.incUnscheduled}
                      title={Text.WeekHours}
                      icon="fa-clock-o">
          <Components.WeekHourDropdownSelector
            id={idPrefix + "weekHours"}
            hours={props.extra.weekHours}
            updateHours={(x) => Charting.updateChart(props, {
              extra: { weekHours: x }
            })}
            showUnscheduled={props.extra.type === "percent" ||
                             props.extra.type === "percent-series"}
            unscheduled={props.extra.incUnscheduled}
            updateUnscheduled={(x) => Charting.updateChart(props, {
              extra: { incUnscheduled: x }
            })}
          />
        </FilterItem>
      </div>

      { anyActive ? <div className="esper-section text-center action"
           onClick={() => resetFilters(props)}>
        <i className="fa fa-fw fa-left fa-refresh" />
        { Text.ResetFilters }
      </div> : null }
    </div>;
  }

  /*
    NB: Resetting filters should reset actual props used as filters,
    not the primary grouping attribute
  */
  function resetFilters(props: Props) {
    // Get current group by value
    let current = props.groupBy.getListSelectJSONFn(props.extra);

    // Get reset version of props
    let resetProps = _.extend({}, props, {
      extra: Charting.defaultExtras(props.team.teamid, props.groupBy)
    }) as Props;

    // Apply current groupBy + type to resets
    let extra = props.groupBy.updateExtraFn(current, resetProps);
    extra.type = props.extra.type;

    Charting.updateChart(props, {
      reset: true,
      extra: {
        type: props.extra.type
      }
    });
  }

  // Returns mapping of whether filters are active or not
  function getFilterState(props: Props): ActiveFilters {
    let defaults = Charting.defaultExtras(props.team.teamid, props.groupBy);
    let current = props.extra;

    // Diff, but ignore for primary group
    return {
      calendars: !_.isEqual(
        props.extra.calIds.length,
        props.team.team_timestats_calendars.length
      ) && props.groupBy !== Charting.GroupByCalendar,

      domains: !_.isEqual(defaults.domains, current.domains)
         && props.groupBy !== Charting.GroupByDomain,

      durations: !_.isEqual(defaults.durations, current.durations)
         && props.groupBy !== Charting.GroupByDuration,

      labels: !_.isEqual(defaults.labels, current.labels)
         && props.groupBy !== Charting.GroupByLabel,

      ratings: !_.isEqual(defaults.ratings, current.ratings)
         && props.groupBy !== Charting.GroupByRating,

      guestCounts: !_.isEqual(defaults.guestCounts, current.guestCounts)
         && props.groupBy !== Charting.GroupByGuestCount,

      filterStr: !_.isEqual(defaults.filterStr, current.filterStr),
      weekHours: !_.isEqual(defaults.weekHours, current.weekHours),
      incUnscheduled: !_.isEqual(
        defaults.incUnscheduled,
        current.incUnscheduled
      )
    };
  }


  // Helper component for filter list items
  function FilterItem({ id, icon, active, title, children } : {
    id?: string;
    icon?: string;
    active?: boolean;
    title: string;
    children?: JSX.Element;
  }) {
    return <div className={classNames("filter-item esper-section", {
      active: active
    })}>
      <label htmlFor={id}>
        { icon ? <i className={"fa fa-fw fa-left " + icon}  /> : null }
        { title }
      </label>
      { children }
    </div>;
  }

  // Filter item for a GroupBy element
  function FilterGroupBy({ groupBy, active, props }: {
    groupBy: Types.GroupBy;
    active?: boolean;
    props: Props;
  }) {
    if (props.groupBy === groupBy) return null;

    let id = Util.randomString + groupBy.name;
    return <FilterItem id={id}
      icon={groupBy.icon}
      title={groupBy.name}
      active={active}
    >
      <Components.ChartSelectorDropdown
        {...props}
        id={id}
        groupBy={groupBy}
        updateFn={(extra) => Charting.updateChart(props, { extra })}
      />
    </FilterItem>
  }
}
