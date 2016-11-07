module Esper.Views {
  interface Props {
    labels: Params.ListSelectJSON;
    teamId: string;
    calIds: string[];
    period: Types.Period;
    filterStr: string;
    view: "week"|"month"|"agenda";
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

        // Get all calendars -> filter below
        cals: _.map(team.team_timestats_calendars,
          (calId) => ({ teamId, calId }))
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
          <div className="sidebar-minus-bottom-menu">
            { _.isEmpty(this.state.selected) ?
              this.renderFilters(chartProps) :
              this.renderBatchLabeling(chartProps) }
          </div>

          <div className="sidebar-bottom-menu">
            <Components.TeamSelector
              teams={Stores.Teams.all()}
              selectedId={this.props.teamId}
              onUpdate={(teamId) => this.update({teamId})}
            />
          </div>
        </Components.Sidebar>

        <div className="esper-content">
          <div id="list-header" className="esper-content-header">
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
            <div className="actions">
              <div className="btn-group">
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
          </div>

          <div className="esper-expanded">
            { this.renderContent(chartProps) }
          </div>
        </div>
      </div>;
    }

    renderViewButton(view: "week"|"month"|"agenda",
                     title: string) {
      return <button className={classNames("btn btn-default", {
        active: view === this.props.view
      })} onClick={() => this.update({ view })}>
        { title }
      </button>
    }

    renderContent(props: Types.ChartProps) {
      if (this.props.view === "week") {
        return <WeekMain ref={(c) => this._main = c}
          {...props}
          {...this.state}
          toggleEvent={this.toggleEvent}
        />;
      }

      else if (this.props.view === "month") {
        return <MonthMain ref={(c) => this._main = c}
          {...props}
          {...this.state}
          toggleEvent={this.toggleEvent}
        />;
      }

      return <AgendaMain ref={(c) => this._main = c}
        {...props}
        {...this.state}
        toggleEvent={this.toggleEvent}
      />;
    }

    renderFilters(props: Types.ChartProps) {
      return <div>
        <div className="action select-action esper-panel-section"
             onClick={() => this.selectAll()}>
          { Text.SelectAll }
        </div>

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
      </div>;
    }

    renderBatchLabeling(props: Types.ChartProps) {
      let eventData = _(this.state.selected)
        .values<Types.TeamEvent>()
        .map((e) => Stores.Events.EventStore.get({
          teamId: e.teamId,
          calId: e.calendarId,
          eventId: e.id
        }).unwrapOr(null))
        .compact()
        .value();

      return <div className="esper-section">
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
      extra?: Types.ChartExtraOpt;
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

        // Fitler str
        if (_.isString(params.extra.filterStr)) {
          newProps.filterStr = params.extra.filterStr;
        }
      }

      Route.nav.go(pathFn({
        teamId: newProps.teamId,
        interval: periodStr.interval,
        calIds: Params.pathForCalIds(newProps.calIds),
        period: periodStr.period
      }), { jsonQuery: {
        labels: newProps.labels,
        filterStr: newProps.filterStr
      } });
    }
  }


  // List props combines props + state from parent element
  interface ListProps extends Types.ChartProps, State {
    toggleEvent: (event: Types.TeamEvent) => void;
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
      return !Charting.eqProps(this.props, newProps);
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
    renderResult({ events, total } : Types.CounterState) {
      return <div className="esper-container">
        <Components.EventList
          events={events}
          teams={[this.props.team]}
          isSelected={(event) => this.isSelected(event)}
          onEventClick={(event) => editEvent(event)}
          onFeedbackClick={(event) => editEvent(event, false)}
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


  // Misc actions
  function editEvent(event: Types.TeamEvent, minFeedback=true) {
    Actions.EventLabels.confirm([event]);
    Layout.renderModal(Containers.eventEditorModal([event], {
      minFeedback
    }));
  }
}
