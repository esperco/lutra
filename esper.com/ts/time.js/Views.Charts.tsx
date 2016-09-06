/*
  View for all of the chart pages
*/

module Esper.Types {
  export interface ChartViewMenu {
    id: string;
    tab: JSX.Element;
    content?: JSX.Element|JSX.Element[];
    onClick?: () => boolean; // Return false to avoid switching state
  }
}

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Props extends Charting.BaseOpts<{}> {
    chart: JSX.Element;

    // Used to render selectors
    events: Types.TeamEvent[];
    selectors?: JSX.Element|JSX.Element[];

    // Other sidebar menus
    menus?: Types.ChartViewMenu[];
  }

  const SidebarMain = "main";
  const SidebarFilter = "filter";

  interface State {
    sidebar: string;
    showFilterMenu?: boolean;
  }

  // Which filters are active?
  interface ActiveFilters {
    calendars: boolean;
    incUnscheduled: boolean;
    incrs: boolean;
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
      this.state = {
        sidebar: SidebarMain
      };
    }

    renderWithData() {
      let filterState = this.getFilterState();

      return <div id="charts-page" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
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
              onUpdate={(teamId) => Charting.updateChart(this.props, {
                teamId: teamId
              })} />
          </div>
        </Components.Sidebar>
        <div className="esper-content">
          <div id="chart-header" className="esper-content-header">
            <Components.PeriodSelector
              period={this.props.period}
              show={
                this.props.extra.type === "calendar" ? ["month"] : undefined
              }
              updateFn={(p) => this.updatePeriod(p)}
            />
            <div className="actions">
              <span className="action filter-action"
                    onClick={() => this.toggleFilterMenu()}>
                <i className={classNames("fa fa-fw", {
                  "fa-close": this.state.showFilterMenu,
                  "fa-filter": !this.state.showFilterMenu,
                  "active": _.some(_.values(filterState)) &&
                            !this.state.showFilterMenu
                })} />
              </span>
            </div>
          </div>
          <div id="chart-expanded" className="esper-expanded">
            { this.state.showFilterMenu ?
              this.renderFilterMenu(filterState) : null }
            { this.props.chart }
          </div>
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
      var defaultMenus: Array<JSX.Element|JSX.Element[]> = [
        this.renderSidebarMain(),
        this.renderSidebarFilters(),
      ];
      var allMenus = defaultMenus.concat(
        _.map(this.props.menus, (m) => m.content)
      );

      // Get index of active menu
      var current = _.findIndex(this.props.menus,
        (m) => m.id === this.state.sidebar
      );
      if (current >= 0) {
        current += defaultMenus.length
      } else if (this.state.sidebar === SidebarFilter) {
        current = 1;
      } else {
        current = 0;
      }

      return _.map(allMenus, (menu, i) => {
        let left = i - current;
        let right = current - i;
        let style = {
          left: (left * 100) + "%",
          right: (right * 100) + "%"
        };
        let classes = classNames(
          "sidebar-minus-top-menu",
          "sidebar-minus-bottom-menu",
          "sidebar-slider", {
            active: i === current
          });

        return <div key={i} style={style} className={classes}>
          { menu }
        </div>;
      });
    }

    renderSidebarMain() {
      var numCals = Stores.Calendars.list(this.props.teamId).match({
        none: () => 0,
        some: (c) => c.length
      });
      return <div>
        { numCals > 1 ? this.renderSidebarMenuOpt({
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
          pathFn: Paths.Time.labelsChart,
          extra: {
            type: "percent",
            incrs: this.props.extra.incrs
          },
          header: Text.ChartLabels,
          content: Text.ChartLabelsDescription,
          icon: "fa-tags"
        }) }

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
          icon: "fa-hourglass"
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
      extra?: Charting.ExtraOptsMaybe;
      header: string;
      icon?: string;
      content?: JSX.Element|string;
    }) {
      var active = pathFn === this.props.pathFn;
      return <div className="esper-panel-section action-block"
        onClick={() => {
          Charting.updateChart(this.props, {
            pathFn: pathFn,
            extra: extra
          });

          /*
            Uncomment to go to filter after changing chart type.
            Disabling for now because this seems confusing for new users.
          */
          // this.setState({ sidebar: SidebarFilter })
        }}>
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
      return <div>
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
          <Components.SearchBox
            icon="fa-search"
            className="form-control"
            placeholder={Text.SearchEventsPlaceholder}
            value={this.props.extra.filterStr}
            onUpdate={(val) => this.updateExtra({ filterStr: val })}
          />
        </div>

        <div className="esper-panel-section">
          { this.renderPrimarySelector() }
        </div>
      </div>;
    }

    renderPrimarySelector() {
      let events = this.props.events;
      let extra = this.props.extra;
      return Charting.matchPrimary(this.props.pathFn, {
        labels: () => <Components.LabelCalcSelector
          { ...this.labelSelectorProps() }
        />,

        calendars: () => <Components.CalCalcSelector
          { ...this.calSelectorProps() }
        />,

        domains: () => <Components.DomainCalcSelector
          { ...this.domainSelectorProps() }
        />,

        durations: () => <Components.DurationSelector
          { ...this.durationProps() }
        />,

        guestCounts: () => <Components.GuestCountSelector
           { ...this.guestCountProps() }
        />,

        ratings: () => <Components.RatingCalcSelector
          { ...this.ratingProps() }
        />
      });
    }

    renderTypeButton(
        type: Charting.ChartType,
        title: string, icon: string) {

      return <button className={classNames("btn btn-default", {
        active: type === this.props.extra.type
      })} onClick={() => this.updateExtra({ type: type })}>
        <Components.Tooltip title={title}>
          <i style={{width: "100%"}} className={"fa fa-fw " + icon} />
        </Components.Tooltip>
      </button>
    }

    renderFilterMenu(active: ActiveFilters) {
      let events = this.props.events;
      let extra = this.props.extra;
      let anyActive = _.some(_.values(active));

      let groupSelectors = Charting.minusPrimary(this.props.pathFn, {
        labels: () => <FilterItem id={this.getId("labels")}
                    active={active.labels}
                    title={Text.ChartLabels}
                    icon="fa-tags">
          <Components.LabelCalcDropdownSelector
            id={this.getId("labels")}
            { ...this.labelSelectorProps() }
          />
        </FilterItem>,

        calendars: () => <FilterItem id={this.getId("calendars")}
                    active={active.calendars}
                    title={Text.ChartCalendars}
                    icon="fa-calendar-o">
          <Components.CalCalcDropdownSelector
            id={this.getId("calendars")}
            { ...this.calSelectorProps() }
          />
        </FilterItem>,

        domains: () => <FilterItem id={this.getId("domains")}
                    active={active.domains}
                    title={Text.GuestDomains}
                    icon="fa-at">
          <Components.DomainCalcDropdownSelector
            id={this.getId("domains")}
            { ...this.domainSelectorProps() }
          />
        </FilterItem>,

        durations: () => <FilterItem id={this.getId("durations")}
                    active={active.durations}
                    title={Text.ChartDuration}
                    icon="fa-hourglass">
          <Components.DurationDropdownSelector
            id={this.getId("durations")}
            { ...this.durationProps() }
          />
        </FilterItem>,

        guestCounts: () => <FilterItem id={this.getId("guest-counts")}
                    active={active.guestCounts}
                    title={Text.ChartGuestsCount}
                    icon="fa-users">
          <Components.GuestCountDropdownSelector
            id={this.getId("guest-counts")}
            { ...this.guestCountProps() }
          />
        </FilterItem>,

        ratings: () => <FilterItem id={this.getId("ratings")}
                    active={active.ratings}
                    title={Text.ChartRatings}
                    icon="fa-star">
          <Components.RatingCalcDropdownSelector
            id={this.getId("ratings")}
            { ...this.ratingProps() }
          />
        </FilterItem>
      });

      return <div className="filter-menu esper-section esper-shade">
        <div className="esper-section esper-flex-list">
          { groupSelectors.labels.unwrapNull() }
          { groupSelectors.calendars.unwrapNull() }
          { groupSelectors.domains.unwrapNull() }
          { groupSelectors.ratings.unwrapNull() }
          { groupSelectors.durations.unwrapNull() }
          { groupSelectors.guestCounts.unwrapNull() }

          <FilterItem id={this.getId("weekHours")}
                      active={active.weekHours || active.incUnscheduled}
                      title={Text.WeekHours}
                      icon="fa-clock-o">
            <Components.WeekHourDropdownSelector
              id={this.getId("weekHours")}
              hours={extra.weekHours}
              updateHours={(x) => this.updateExtra({ weekHours: x })}
              showUnscheduled={extra.type === "percent"}
              unscheduled={extra.incUnscheduled}
              updateUnscheduled={(x) => this.updateExtra({ incUnscheduled: x })}
            />
          </FilterItem>

          {
            extra.type === "calendar" ? null :
            <FilterItem id={this.getId("incrs")}
                        active={active.incrs}
                        title="Compare With"
                        icon="fa-flip-horizontal fa-tasks">
              <Components.RelativePeriodDropdownSelector
                id={this.getId("incrs")}
                period={this.props.period}
                allowedIncrs={[-1, 1]}
                selectedIncrs={extra.incrs}
                updateFn={(x) => this.updateExtra({incrs: x })}
              />
            </FilterItem>
          }
        </div>

        { anyActive ? <div className="esper-section text-center action"
             onClick={() => this.resetFilters()}>
          <i className="fa fa-fw fa-left fa-refresh" />
          { Text.ResetFilters }
        </div> : null }
      </div>;
    }

    toggleFilterMenu() {
      this.mutateState((s) => s.showFilterMenu = !s.showFilterMenu);
    }

    // Returns which filters are active / not-active
    getFilterState(): ActiveFilters {
      let defaults = Charting.cleanExtra({}, this.props.pathFn);
      let current = this.props.extra;
      let team = Stores.Teams.require(this.props.teamId);
      let ret = {
        calendars: !_.isEqual(
          this.props.calIds.length, team.team_timestats_calendars.length),
        incUnscheduled: !_.isEqual(
          defaults.incUnscheduled,
          current.incUnscheduled
        ),
        incrs: !_.isEqual(defaults.incrs, current.incrs),
        filterStr: !_.isEqual(defaults.filterStr, current.filterStr),
        domains: !_.isEqual(defaults.domains, current.domains),
        durations: !_.isEqual(defaults.durations, current.durations),
        labels: !_.isEqual(defaults.labels, current.labels),
        ratings: !_.isEqual(defaults.ratings, current.ratings),
        guestCounts: !_.isEqual(defaults.guestCounts, current.guestCounts),
        weekHours: !_.isEqual(defaults.weekHours, current.weekHours)
      };

      // Ignore filter for primary group
      Charting.matchPrimary(this.props.pathFn, {
        labels: () => delete ret.labels,
        calendars: () => delete ret.calendars,
        domains: () => delete ret.domains,
        guestCounts: () => delete ret.guestCounts,
        ratings: () => delete ret.ratings,
        durations: () => delete ret.durations
      });

      return ret;
    }


    /* Returns properties for selectors */

    labelSelectorProps() {
      return {
        team: Stores.Teams.require(this.props.teamId),
        selected: this.props.extra.labels,
        calculation: new EventStats.LabelCountCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (x: Types.ListSelectJSON) => this.updateExtra({labels: x})
      };
    }

    calSelectorProps() {
      let cals = Option.matchList(Stores.Calendars.list(this.props.teamId));
      return {
        calendars: cals,
        selectedIds: this.props.calIds,
        calculation: new EventStats.CalendarCountCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (calIds: string[]) => Charting.updateChart(this.props, {
          calIds: calIds
        })
      };
    }

    domainSelectorProps() {
      return {
        selected: this.props.extra.domains,
        calculation: new EventStats.DomainCountCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (x: Types.ListSelectJSON) => this.updateExtra({
          domains: x,

          // Guest count none and domain none should be the same
          guestCounts: _.extend({}, this.props.extra.guestCounts, {
            none: x.none
          }) as Params.ListSelectJSON
        })
      };
    }

    ratingProps() {
      return {
        selected: this.props.extra.ratings,
        calculation: new EventStats.RatingCountCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (x: Types.ListSelectJSON) => this.updateExtra({ratings: x})
      };
    }

    durationProps() {
      return {
        selected: this.props.extra.durations,
        calculation: new EventStats.DurationBucketCountCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (x: Types.ListSelectJSON) => this.updateExtra({durations: x})
      };
    }

    guestCountProps() {
      return {
        selected: this.props.extra.guestCounts,
        calculation: new EventStats.GuestCountBucketCalc(
          this.props.events, this.props.extra
        ),
        updateFn: (x: Types.ListSelectJSON) => this.updateExtra({
          guestCounts: x,

          // Guest count none and domain none should be the same
          domains: _.extend({}, this.props.extra.domains, {
            none: x.none
          }) as Params.ListSelectJSON
        })
      };
    }


    /* Action functions */

    updatePeriod(period: Period.Single|Period.Custom) {
      Charting.updateChart(this.props, {
        period: period
      });
    }

    /*
      NB: Resetting filters should reset actual props used as filters,
      not the primary grouping attribute
    */
    resetFilters() {
      Charting.updateChart(this.props, {
        reset: true,
        calIds: this.props.pathFn === Paths.Time.calendarsChart ?
          this.props.calIds : undefined,
        extra: {
          type: this.props.extra.type,
          labels: this.props.pathFn === Paths.Time.labelsChart ?
            this.props.extra.labels : undefined,
          domains: this.props.pathFn === Paths.Time.guestsChart ?
            this.props.extra.domains : undefined,
          guestCounts: this.props.pathFn === Paths.Time.guestsCountChart ?
            this.props.extra.labels : undefined,
          ratings: this.props.pathFn === Paths.Time.ratingsChart ?
            this.props.extra.labels : undefined,
          durations: this.props.pathFn === Paths.Time.durationsChart ?
            this.props.extra.durations : undefined
        }
      });
    }

    updateExtra(extra: Charting.ExtraOptsMaybe) {
      Charting.updateChart(this.props, {
        extra: extra
      });
    }
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
}
