/*
  View for event "search" (really filtering) and drilldown by label
*/

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface FilterListProps extends Params.FilterListJSON {
    cals: Stores.Calendars.CalSelection[];
    period: Period.Single;
  }

  interface FilterListState {
    selected?: Stores.Events.TeamEvent[];
    actionsPinned?: boolean;
  }

  export class FilterList extends Component<FilterListProps, FilterListState> {
    _actionMenu: HTMLDivElement;
    _actionMenuOffset: number;
    _editModalId: number;
    _editModalEvents: Stores.Events.TeamEvent[];
    _goToTodayOnUpdate: boolean;

    // Use state to track selected events -- reset everytime props change
    constructor(props: FilterListProps) {
      super(props);
      this.state = {
        selected: [],
        actionsPinned: false
      };
    }

    componentWillReceiveProps() {
      this.setState({selected: []});
    }

    componentDidMount() {
      $(window).scroll(this.pinActions.bind(this));
    }

    componentDidUpdate() {
      if (this._goToTodayOnUpdate) {
        this.goToToday();
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      $(window).off('scroll', this.pinActions.bind(this));
    }

    // Pin the action header based on scroll position
    pinActions() {
      if (this._actionMenu) {
        // Only record action menu offset once (since it'll change once pinned)
        if (_.isUndefined(this._actionMenuOffset)) {
          this._actionMenuOffset = $(this._actionMenu).offset().top;
        }
        if ($(window).scrollTop() > this._actionMenuOffset) {
          if (! this.state.actionsPinned) {
            this.setState({actionsPinned: true})
          }
        } else if (this.state.actionsPinned) {
          this.setState({actionsPinned: false})
        }
      }
    }

    getEventData() {
      // Merge event lists for multiple calendars
      var eventData = Option.flatten(
        _.map(this.props.cals, (c) =>
          Stores.Events.getForPeriod({
            teamId: c.teamId,
            calId: c.calId,
            period: this.props.period
          })
        )
      );

      var events = _.flatten(_.map(eventData, (e) => e.events));
      return {
        events: _.sortBy(events, (e) => moment(e.start)),
        isBusy: !!_.find(eventData, (e) => e.isBusy),
        hasError: !!_.find(eventData, (e) => e.hasError)
      };
    }

    filterEvents(events: Stores.Events.TeamEvent[]) {
      if (! this.props.labels.all) {
        events = _.filter(events, (e) =>
          ( this.props.labels.none &&
            Stores.Events.getLabels(e).length === 0) ||
          ( _.intersection(
              this.props.labels.some,
              Stores.Events.getLabelIds(e)
            ).length > 0)
        );
      }

      if (this.props.filterStr) {
        events = _.filter(events,
          (e) => e.title &&
                 _.includes(e.title.toLowerCase(),
                            this.props.filterStr.toLowerCase())
        );
      }

      return events;
    }

    renderWithData() {
      this.updateModal();
      var eventData = this.getEventData();
      var events = eventData.events;
      var filteredEvents = this.filterEvents(events);
      var hiddenEvents = events.length - filteredEvents.length;

      return <div className="container filter-list">
        <div className="list-selectors">
          <div className="row">
            { this.renderCalSelector() }
            { this.renderMonthSelector() }
          </div>
          <div className="row">
            { this.renderLabelSelector(events) }
            { this.renderFilterStr() }
          </div>
        </div>
        { this.renderActionMenu(filteredEvents) }
        { this.state.actionsPinned ?
          <div className="list-action-menu-filler" /> : null }
        { hiddenEvents ? this.renderFilterMsg(hiddenEvents) : null }
        { (() => {
          if (eventData.hasError) {
            return <Components.ErrorMsg />;
          }
          if (eventData.isBusy) {
            return <div className="esper-spinner esper-centered esper-large" />;
          }
          return this.renderMain(filteredEvents);
        })() }
      </div>;
    }

    renderCalSelector() {
      var teams = Stores.Teams.all();
      var calendarsByTeamId = Stores.Calendars.byTeamId();

      return <div className="col-sm-6 form-group">
        <Components.CalSelectorDropdownWithIcon
          teams={teams}
          allowMulti={true}
          calendarsByTeamId={calendarsByTeamId}
          selected={this.props.cals}
          updateFn={(x) => this.updateRoute({
            cals: x
          })}
        />
      </div>;
    }

    renderMonthSelector() {
      return <div className="col-sm-6 form-group">
        <Components.PeriodSelectorWithIcon
          period={this.props.period}
          updateFn={(x) => this.updateRoute({
            period: x
          })}
        />
      </div>;
    }

    renderLabelSelector(events: Stores.Events.TeamEvent[]) {
      var labels = Labels.fromEvents(events, Stores.Teams.all());
      labels = Labels.sortLabels(labels);
      return <div className="col-sm-6 form-group">
        <Components.LabelSelectorDropdown labels={labels}
          totalCount={events.length}
          unlabeledCount={Labels.countUnlabeled(events)}
          selected={this.props.labels.some}
          allSelected={this.props.labels.all}
          unlabeledSelected={this.props.labels.none}
          showUnlabeled={true}
          updateFn={(x) => this.updateRoute({
            labels: {
              all: x.all,
              none: x.unlabeled,
              some: x.all ? [] : x.labels
            }
          })} />
      </div>;
    }

    renderFilterStr() {
      return <div className="col-sm-6 form-group">
        <FilterStr value={this.props.filterStr} onUpdate={(val) => {
          this.updateRoute({
            filterStr: val
          }, { replace: true })
        }}/>
      </div>;
    }

    renderFilterMsg(hiddenEvents: number) {
      return <div className="list-filter-msg">
        <span className="muted">
          {hiddenEvents} Events Not Shown
        </span>
        <span className="pull-right action esper-clear-action" onClick={
          () => this.resetFilters()
        }>
          <i className="fa fa-times" />
        </span>
      </div>;
    }

    renderActionMenu(events: Stores.Events.TeamEvent[]) {
      var icon = (() => {
        if (this.isAllSelected(events)) {
          return "fa-check-square-o";
        } else if (this.isSomeSelected(events)) {
          return "fa-minus-square-o";
        }
        return "fa-square-o";
      })();

      return <div ref={(c) => this._actionMenu = c} className={
        classNames("list-action-menu", "esper-inverse", {
          pinned: this.state.actionsPinned
        })
      }>
        <div className="list-action-menu-container">
          <div className="action" onClick={() => this.toggleAll(events)}>
            <span className="event-checkbox">
              <i className={"fa fa-fw " + icon} />
            </span>
            <span className="hidden-xs">
              {" "}Select All
            </span>
          </div>
          {
            this.state.selected.length ?
            <div className="action" onClick={() => this.editSelectedEvents()}>
              <i className="fa fa-fw fa-tag" />
              <span className="hidden-xs">
                {" "}Label
              </span>
            </div> :
            null
          }
          <div className="action" onClick={() => this.goToToday()}>
            <i className="fa fa-fw fa-calendar-o" />
            <span className="hidden-xs">
              {" "}Today
            </span>
          </div>
          <div className="pull-right">
            { this.getStats() }
            <div className="action"
               onClick={() => this.refreshEvents()}>
              <i className="fa fa-fw fa-refresh" />
            </div>
          </div>
        </div>
      </div>
    }

    // Scroll to today (or next day if no event today) -- only if we haven't
    // scrolled once for this day
    goToToday() {
      var current = Period.current(this.props.period.interval);
      if (this.props.period.index === current.index) {
        var target = this.find(".today, .future").first().offset();
        if (!target || !target.top) {
          target = this.find(".day").last().offset();
        }
        if (target && target.top) {
           $('html, body').animate({
            scrollTop: target.top - 150 // To account for header
          }, 600);
          this._goToTodayOnUpdate = false;
        }
      } else {
        // Wrong month -> go this month and then call this function again
        // after data loads
        this._goToTodayOnUpdate = true;
        this.updateRoute({period: current});
      }
    }

    getStats() {
      var events = this.state.selected;
      if (! events.length) {
        return;
      }
      var duration = EventStats.aggregateDuration(events);

      return <div className="event-stats">
        { events.length }{" "}Events,{" "}
        { Util.roundStr(EventStats.toHours(duration), 2) }{" "}Hours
      </div>;
    }

    resetFilters() {
      this.updateRoute({
        labels: {
          all: true,
          none: true,
          some: []
        },
        filterStr: ""
      });
    }

    refreshEvents() {
      if (Util.notEmpty(this.props.cals)) {
        Stores.Events.fetchPredictionsForPeriod({
          teamId: this.props.cals[0].teamId,
          period: this.props.period,
          force: true
        });
      }
    }

    renderMain(events: Stores.Events.TeamEvent[]) {
      var teams = Stores.Events.getTeams(events);
      return <Components.EventList
        events={events}
        teams={teams}
        selectedEvents={this.state.selected}
        onEventClick={(event) => this.editEvent(event)}
        onAddLabelClick={(event) => this.editEvent(event)}
        onFeedbackClick={(event) => this.editEvent(event, false)}
        onEventToggle={(event) => this.toggleEvent(event)}
      />;
    }

    editEvent(event: Stores.Events.TeamEvent, minFeedback=true) {
      this.renderModal([event], minFeedback);
    }

    editSelectedEvents() {
      this.renderModal(this.state.selected);
    }

    renderModal(events: Stores.Events.TeamEvent[], minFeedback=true) {
      this._editModalEvents = events;
      this._editModalId = Layout.renderModal(
        this.getModal(events, minFeedback));
    }

    updateModal() {
      if (this._editModalEvents && this._editModalEvents.length &&
          this._editModalId)
      {
        Layout.updateModal(
          this.getModal(this._editModalEvents),
          this._editModalId
        );
      }
    }

    getModal(events: Stores.Events.TeamEvent[], minFeedback=true) {
      // Refresh data from store before rendering modal
      var eventData = _(events)
        .map((e) => Stores.Events.EventStore.get({
          teamId: e.teamId,
          calId: e.calendarId,
          eventId: e.id
        }))
        .filter((e) => e.isSome())
        .map((e) => e.unwrap())
        .value();

      return <Components.EventEditorModal eventData={eventData}
                                          teams={Stores.Teams.all()}
                                          focusOnLabels={minFeedback}
                                          minFeedback={minFeedback} />;
    }

    toggleEvent(event: Stores.Events.TeamEvent) {
      var selected = this.state.selected;
      var index = this.findIndex(event);
      if (index >= 0) {
        selected = _.filter(selected,
          (s) => !Stores.Events.matchRecurring(event, s)
        );
      } else {
        selected = selected.concat([event]);
      }
      this.setState({
        selected: selected
      });
    }

    isSelected(event: Stores.Events.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Stores.Events.TeamEvent) {
      return _.findIndex(this.state.selected, (e) =>
        Stores.Events.matchRecurring(e, event)
      );
    }

    toggleAll(events: Stores.Events.TeamEvent[]) {
      if (this.isSomeSelected(events)) {
        this.setState({ selected: [] })
      } else {
        this.setState({ selected: events })
      }
    }

    isAllSelected(events: Stores.Events.TeamEvent[]) {
      return this.state.selected.length &&
        _.every(events, (e) => this.isSelected(e));
    }

    isSomeSelected(events: Stores.Events.TeamEvent[]) {
      return this.state.selected.length &&
        !!_.find(events, (e) => this.isSelected(e));
    }

    updateRoute(newProps: {
      cals?: Stores.Calendars.CalSelection[];
      period?: Period.Single;
      filterStr?: string;
      labels?: Params.ListSelectJSON;
    }, opts: Route.nav.Opts = {}) {
      var pathForCals = Params.pathForCals(newProps.cals || this.props.cals);
      var period = newProps.period || this.props.period;
      var path = "/list/" + (_.map([
        pathForCals[0],
        pathForCals[1],
        period.interval[0],
        period.index.toString()
      ], encodeURIComponent)).join("/");
      opts.jsonQuery = {
        filterStr: Util.some(newProps.filterStr, this.props.filterStr),
        labels: Util.some(newProps.labels, this.props.labels)
      } as Params.FilterListJSON;
      Route.nav.path(path, opts);
    }
  }


  /////////

  interface FilterStrProps {
    // The "default" or original value
    value: string;
    onUpdate: (newValue: string) => void;
  }

  interface FilterStrState {
    // The current value in the input
    value: string;
  }

  class FilterStr extends Component<FilterStrProps, FilterStrState> {
    _timeout: number;

    constructor(props: FilterStrProps) {
      super(props);
      this.state = { value: this.props.value };
    }

    render() {
      return <div className="esper-clearable">
        <div className="input-group">
          <span className="input-group-addon">
            <i className="fa fa-fw fa-search" />
          </span>
          <input type="text" className="form-control"
            placeholder="Search Title"
            value={this.state.value || ""}
            onChange={
              (e) => this.onChange((e.target as HTMLInputElement).value)
            } />
        </div>
        {
          this.state.value ?
          <span className="esper-clear-action" onClick={() => this.reset()}>
            <i className="fa fa-fw fa-times" />
          </span> :
          null
        }
      </div>;
    }

    onChange(val: string) {
      this.setState({ value: val });
      this.setTimeout();
    }

    setTimeout() {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(
        () => this.props.onUpdate(this.state.value), 500
      );
    }

    reset() {
      clearTimeout(this._timeout);
      this.setState({ value: null });
      this.props.onUpdate("");
    }

    componentWillReceiveProps(nextProps: FilterStrProps) {
      clearTimeout(this._timeout);
      this.setState({value: nextProps.value});
    }

    componentWillUnmount(){
      super.componentWillUnmount();
      clearTimeout(this._timeout);
    }
  }
}
