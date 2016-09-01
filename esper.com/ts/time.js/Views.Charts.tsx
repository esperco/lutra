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
    selectors?: JSX.Element|JSX.Element[];

    // Other sidebar menus
    menus?: Types.ChartViewMenu[];
  }

  const SidebarMain = "main";
  const SidebarFilter = "filter";

  interface State {
    sidebar: string;
  }

  export class Charts extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        sidebar: SidebarMain
      };
    }

    renderWithData() {
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
          </div>
          <div id="chart-expanded" className="esper-expanded">
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

        { this.props.selectors }
      </div>;
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

    updatePeriod(period: Period.Single|Period.Custom) {
      Charting.updateChart(this.props, {
        period: period
      });
    }

    updateExtra(extra: Charting.ExtraOptsMaybe) {
      Charting.updateChart(this.props, {
        extra: extra
      });
    }
  }
}
