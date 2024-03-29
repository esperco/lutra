module Esper.Views {
  interface Props {
    labels: Params.ListSelectJSON;
    teamId: string;
    calIds: string[];
    period: Types.Period;
    filterStr: string;
    view: "week"|"month"|"agenda";
    hideInactive: boolean;
  }

  interface State {
    // NB: ID should be *recurring* ID
    selected: {[index: string]: Types.TeamEvent};
  }

  export class List extends ReactHelpers.Component<Props, State> {
    _main: ListMain;

    constructor(props: Props) {
      super(props);
      this.state = { selected: {} };
    }

    componentWillReceiveProps(props: Props) {
      this.clearSelection();
    }

    renderWithData() {
      let { teamId, period } = this.props;
      let team = Stores.Teams.require(teamId);
      let calendars = Stores.Calendars.list(teamId).unwrapOr([]);
      let subscription = team.team_api.team_subscription;

      // Segment period by start/end and get by each day
      let [start, end] = Period.bounds(period);
      let dayPeriod = Period.fromDates("day", start, end);
      let eventData = Stores.Events.require({
        period: dayPeriod,
        teamId
      });

      let { eventsForRanges, hasError, isBusy } = eventData;

      // The label selector and event list are both "charts" that filter by
      // label + cal
      let extra = Charting.defaultExtras(teamId, Charting.GroupByLabel);
      extra.labels = this.props.labels;
      extra.calIds = this.props.calIds;
      extra.filterStr = this.props.filterStr;

      let chartProps: Types.ChartProps = {
        eventsForRanges, hasError, isBusy,
        team, calendars, period, extra,
        groupBy: Charting.GroupByLabel
      }

      return <div id="list-view" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
          <div className="sidebar">
            <div className="esper-panel-section">
              <Components.SidebarNav
                teamId={this.props.teamId}
                active="list"
              />
            </div>
            { _.isEmpty(this.state.selected) ?
              this.renderFilters(chartProps) :
              this.renderBatchLabeling(chartProps) }
          </div>
        </Components.Sidebar>

        <div className="esper-content">
          <div id="list-header" className="esper-content-header">
            <Components.SidebarToggle side="left">
              <i className="fa fa-fw fa-bars" />
            </Components.SidebarToggle>

            { this.renderSelectAll() }

            <Components.PeriodSelector
              minDate={Config.getMinDate(subscription.plan)}
              maxDate={Config.MAX_DATE}
              isLimited={Config.disableAdvancedFeatures(subscription.plan)}
              onLimitClick={
                () => Actions.Charts.renderPlanUpgradeModal(subscription.cusid)
              }
              period={this.props.period}
              updateFn={(p) => this.update({ period: p })}
              hintDismissed={Stores.Hints.get('PeriodSelectorHint')}
              show={["week", "month"]}
            />
            <div className="btn-group hidden-xs">
              <div className="btn-group">
                { this.renderViewButton("week", Text.WeekView) }
              </div>
              <div className="btn-group">
                { this.renderViewButton("month", Text.MonthView) }
              </div>
              <div className="btn-group">
                { this.renderViewButton("agenda", Text.AgendaView) }
              </div>
            </div>
          </div>

          { this.renderContent(chartProps) }
        </div>
      </div>;
    }

    renderViewButton(view: "week"|"month"|"agenda",
                     title: string) {
      let firstChar = title[0];
      let rest = title.slice(1);
      return <button className={classNames("btn btn-default", {
        active: view === this.props.view
      })} onClick={() => this.update({ view })}>
        <span>{ firstChar }</span><span>{ rest }</span>
      </button>
    }

    renderSelectAll() {
      return _.isEmpty(this.state.selected) ?
        <button className="btn btn-default select-btn"
                onClick={() => this.selectAll()}>
          <i className="fa fa-fw fa-left fa-square-o" />
          <span>{ Text.SelectAll }</span>
        </button> :
        <button className="btn btn-default select-btn"
                onClick={() => this.clearSelection()}>
          <i className="fa fa-fw fa-left fa-check-square-o" />
          <span>{ Text.SelectNone }</span>
        </button>;
    }

    renderContent(props: Types.ChartProps) {
      if (this.props.view === "week") {
        return <WeekMain ref={(c) => this._main = c}
          {...props}
          {...this.state}
          hideInactive={this.props.hideInactive}
          toggleEvent={this.toggleEvent}
        />;
      }

      else if (this.props.view === "month") {
        return <MonthMain ref={(c) => this._main = c}
          {...props}
          {...this.state}
          hideInactive={this.props.hideInactive}
          toggleEvent={this.toggleEvent}
        />;
      }

      return <AgendaMain ref={(c) => this._main = c}
        {...props}
        {...this.state}
        hideInactive={this.props.hideInactive}
        toggleEvent={this.toggleEvent}
      />;
    }

    renderFilters(props: Types.ChartProps) {
      return <div className="esper-panel-section">
        <div className="esper-panel-section">
          <Components.SearchBox
            icon="fa-search"
            className="form-control"
            placeholder={Text.SearchEventsPlaceholder}
            value={this.props.filterStr}
            onUpdate={(filterStr) => this.update({ extra: { filterStr }})}
          />
        </div>

        { props.calendars.length > 1 ?
          <div className="esper-panel-section">
            <div className="esper-header">
              <i className="fa fa-fw fa-left fa-tags" />
              { Text.ChartCalendars }
            </div>
            <Components.ChartSelector
              { ...props }
              groupBy={Charting.GroupByCalendar}
              updateFn={(extra) => this.update({ extra })}
            />
          </div> : null }

        <div className="esper-panel-section">
          <div className="esper-header">
            <i className="fa fa-fw fa-left fa-tags" />
            { Text.ChartLabels }
          </div>
          <Components.ChartSelector
            { ...props }
            groupBy={Charting.GroupByLabel}
            updateFn={(extra) => this.update({ extra })}
          />
        </div>

        <HiddenEventsToggle
          eventsForRanges={props.eventsForRanges}
          selected={!this.props.hideInactive}
          onToggle={() => this.update({
            extra: { hideInactive: !this.props.hideInactive }
          })}
        />
      </div>;
    }

    renderBatchLabeling(props: Types.ChartProps) {
      let eventData = _(this.state.selected)
        .values<Types.TeamEvent>()
        .map((e) => Stores.Events.EventStore.get({
          teamId: e.teamId,
          eventId: e.id
        }).unwrapOr(null))
        .compact()
        .value();

      return <div className="esper-panel-section">
        <div className="action unselect-action esper-panel-section"
             onClick={() => this.clearSelection()}>
          { Text.eventsSelected(eventData.length) }
          <i className="fa fa-fw fa-close" />
        </div>
        <Components.EventEditor
          className="esper-panel-section"
          eventData={eventData}
          teams={[Stores.Teams.require(this.props.teamId)]}
          focusOnLabels={true}
          forceBatch={true}
        />
        <AggregateDuration
          className="esper-panel-section aggregate-hours"
          eventsForRanges={props.eventsForRanges}
          filterFns={[
            // Filter for selected (or recurring selected)
            (e) => !!this.state.selected[Stores.Events.strId(e, true)]
          ]}
        />
      </div>;
    }

    // Auto-bound arrow function
    toggleEvent = (event: Types.TeamEvent) => {
      let key = Stores.Events.strId(event, true);
      let selected = _.clone(this.state.selected);
      if (!!selected[key]) {
        delete selected[key];
      } else {
        selected[key] = event;
      }
      this.setState({ selected });
    }

    clearSelection() {
      this.setState({ selected: {} });
    }

    selectAll() {
      let selected: {[index: string]: Types.TeamEvent} = {};

      // Get visible events from current "main" view -- then convert
      // IDs to recurring form
      let eventMap = this._main
        .getResult()
        .map((r) => r.eventMap)
        .unwrapOr({});
      _.each(eventMap, (ev) => selected[Stores.Events.strId(ev, true)] = ev);

      this.setState({ selected });
    }

    isSelected(event: Types.TeamEvent) {
      let key = Stores.Events.strId(event, true);
      return !!this.state.selected[key];
    }

    update(params: {
      teamId?: string;
      period?: Types.Period;
      view?: "week"|"month"|"agenda";
      extra?: Types.ChartExtraOpt & {hideInactive?: boolean};
    }) {
      var newProps = _.extend({}, this.props, params) as Props;
      var periodStr = Params.periodStr(newProps.period);
      var pathFn = (() => {
        switch (newProps.view) {
          case "week":
            return Paths.Time.listWeek;
          case "month":
            return Paths.Time.listMonth;
          default:
            return Paths.Time.listAgenda;
        }
      })();

      // Cal Id filters
      if (params.extra) {
        if (params.extra.calIds) {
          newProps.calIds = params.extra.calIds;
        }

        // Label filters
        if (params.extra.labels) {
          newProps.labels = params.extra.labels;
        }

        // Filter str
        if (_.isString(params.extra.filterStr)) {
          newProps.filterStr = params.extra.filterStr;
        }

        // Toggle hidden events
        if (_.isBoolean(params.extra.hideInactive)) {
          newProps.hideInactive = params.extra.hideInactive;
        }
      }

      Route.nav.go(pathFn({
        teamId: newProps.teamId,
        interval: periodStr.interval,
        calIds: Params.pathForCalIds(newProps.calIds),
        period: periodStr.period
      }), { jsonQuery: {
        labels: newProps.labels,
        filterStr: newProps.filterStr,
        hideInactive: newProps.hideInactive
      } });
    }
  }


  // List props combines props + state from parent element
  interface ListProps extends Types.ChartProps, State {
    toggleEvent: (event: Types.TeamEvent) => void;
    hideInactive: boolean;
  }

  /*
    Base class for list view content -- uses chart class as a base because
    we want to asynchronously filter out certain events.
  */
  abstract class ListMain extends
      Components.DataChart<Types.CounterState, ListProps> {
    getCalc(props: ListProps): Calc<Types.CounterState> {
      return EventStats.simpleFilterCalc(
        props.eventsForRanges, [
          function filterActive(e) {
            return props.hideInactive ? Stores.Events.isActive(e) : true;
          },

          function filterCalendar(e) {
            return Charting.GroupByCalendar.keyFn(e, props).isSome()
          },

          function filterLabel(e) {
            return Charting.GroupByLabel.keyFn(e, props).isSome()
          },

          function filterStr(e) {
            return Stores.Events.filterOne(e, props.extra.filterStr);
          }
        ]
      );
    }

    /*
      Don't update if props are mostly the same. This should be by-passed if
      calc is firing because it calls forceUpdate
    */
    shouldCalcUpdate(newProps: ListProps) {
      return !Charting.eqFilterProps(this.props, newProps) ||
             this.props.hideInactive !== newProps.hideInactive;
    }

    isSelected(event: Types.TeamEvent) {
      let key = Stores.Events.strId(event, true);
      return !!this.props.selected[key];
    }
  }

  // Render week view
  class WeekMain extends ListMain {
    // Use eventMap to determine whether event is filtered out
    renderResult({ eventMap } : Types.CounterState) {
      return <Components.WeekView
        eventDates={ _.map(this.props.eventsForRanges, (e) => ({
          date: e.range[0],
          events: e.events
        })).slice(0, 7) }

        renderEvent={(e) => !!eventMap[Stores.Events.strId(e)] ?
          <WeekMonthEvent event={e}
            selected={this.isSelected(e)}
            toggleEvent={this.props.toggleEvent}
          /> : null
        }
      />;
    }
  }

  // Render calednar grid for month
  class MonthMain extends ListMain {
    renderResult({ eventMap } : Types.CounterState) {
      // Use original props for index of day to events
      let eventsByDay: {[index: string]: Types.TeamEvent[]} = {};
      _.each(this.props.eventsForRanges, (d) => {
        eventsByDay[moment(d.range[0]).format("YYYY-DDD")] = d.events;
      });

      return <Components.CalendarGrid
        className="month-view"
        date={Period.bounds(this.props.period)[0]}
        dayFn={(day) => <div className="events">
          { _.map(eventsByDay[moment(day).format("YYYY-DDD")] || [],

            // Use eventMap to determine whether event is filtered out
            (e) => {
              let key = Stores.Events.strId(e); // Calc is not recurring
              return !!eventMap[key] ?
                <WeekMonthEvent event={e} key={key}
                  selected={this.isSelected(e)}
                  toggleEvent={this.props.toggleEvent}
                /> : null
            }
          ) }
        </div>}
      />;
    }
  }

  /*
    Individual, selectable event for week and month views (agenda does its
    own thing)
  */
  function WeekMonthEvent({event, selected, toggleEvent} : {
    event: Types.TeamEvent,
    selected: boolean;
    toggleEvent: (event: Types.TeamEvent) => void;
  }) {
    let labels = Stores.Events.getLabels(event);
    let style: { background?: string; color?: string } = {};
    let tooltip = Text.Unlabeled;
    if (!_.isEmpty(labels)) {
      let label = labels[0];
      let baseColor = label.color;
      style.background = baseColor;
      style.color = Colors.colorForText(baseColor);
      tooltip = label.displayAs;
    }
    let inactive = !Stores.Events.isActive(event);

    return <div key={Stores.Events.strId(event)}
      className={classNames("event", { selected, inactive })}
      style={style}>
      <Components.Tooltip style={{display: "block"}} title={tooltip}>
        <i className={classNames("fa fa-fw check", {
          "fa-check-square-o": selected,
          "fa-square-o": !selected
        })} onClick={() => toggleEvent(event)} />
        <span className="action-block"
              onClick={(e) => (e.shiftKey ? toggleEvent : editEvent)(event)}>
          { event.title }
        </span>
      </Components.Tooltip>
    </div>;
  }

  // Render an agenda
  class AgendaMain extends ListMain {
    renderResult({ eventMap } : Types.CounterState) {
      // Use eventMap to filter out prop events
      let events = Stores.Events.uniqueEvents(this.props.eventsForRanges);
      events = _.filter(events, (e) => !!eventMap[Stores.Events.strId(e)]);

      return <div className="esper-container">
        <Components.EventList
          events={events}
          teams={[this.props.team]}
          isSelected={(event) => this.isSelected(event)}
          onEventClick={(event) => editEvent(event)}
          onEventToggle={(event) => this.props.toggleEvent(event)}
        />
      </div>;
    }
  }


  // Simple widget that displays total event hours
  interface AggregateDurationProps {
    className?: string;
    eventsForRanges: Types.EventsForRange[];
    filterFns: Types.FilterFn[];
  }

  class AggregateDuration extends
    Components.Chart<Types.GroupState, AggregateDurationProps>
  {
    getCalc(props: AggregateDurationProps): Calc<Types.GroupState> {
      return EventStats.defaultGroupDurationCalc(
        props.eventsForRanges, props.filterFns, (e) => Option.some([""])
      );
    }

    render() {
      return this.getResult().match({
        none: () => null,
        some: ({ group } : Types.GroupState) => {
          let hours = EventStats.toHours(group.all.totalValue);
          return <div className={this.props.className}>
            { Text.hours(hours) }
          </div>;
        }
      });
    }
  }


  interface HiddenEventsToggleProps {
    eventsForRanges: Types.EventsForRange[];
    selected: boolean;
    onToggle: () => void;
  }

  class HiddenEventsToggle extends
    Components.CalcUI<Types.CounterState, HiddenEventsToggleProps>
  {
    getCalc(props: HiddenEventsToggleProps) {
      let eventsForRanges = props.eventsForRanges;
      return EventStats.simpleCounterCalc(eventsForRanges, [
        (e) => !Stores.Events.isActive(e)
      ]);
    }

    // Button to manually launch
    render() {
      return this.state.result.mapOr(
        null,
        (counts) => counts.total > 0 ?
          <div className="esper-panel-section">
            <div className="esper-select-menu">
              <div className={classNames("esper-selectable hidden-link", {
                active: this.props.selected
              })} onClick={this.props.onToggle}>
                <i className={classNames("fa fa-fw fa-left", {
                  "fa-check-square-o": this.props.selected,
                  "fa-square-o": !this.props.selected
                })} />
                { Text.HiddenEventsToggle }
                <Components.BadgeLight
                  text={counts.total.toString()}
                />
              </div>
            </div>
          </div> : null
      );
    }
  }


  // Misc actions
  function editEvent(event: Types.TeamEvent) {
    Actions.EventLabels.confirm([event]);
    Layout.renderModal(Containers.eventEditorModal([event]));
  }
}
