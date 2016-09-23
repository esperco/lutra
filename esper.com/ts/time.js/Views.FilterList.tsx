/*
  View for event "search" (really filtering) and drilldown by label
*/

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface FilterListProps extends Params.FilterListJSON {
    cals: Stores.Calendars.CalSelection[];
    period: Types.Period;
    unconfirmed: boolean;
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

    /*
      Map of filtered event _ids -- this is set by the filtering function
      and reset whenever we receive props. Use this to keep showing events
      even if filtering means implies the events should be hidden.
    */
    _eventIdMap: { [index: string]: boolean };

    // Use state to track selected events -- reset everytime props change
    constructor(props: FilterListProps) {
      super(props);
      this.state = {
        selected: [],
        actionsPinned: false
      };
      this._eventIdMap = {};
    }

    componentWillReceiveProps() {
      this.setState({selected: []});
      this._eventIdMap = {};
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
      return Stores.Events.require({
        cals: this.props.cals,
        period: this.props.period
      });
    }

    filterEvents(events: Stores.Events.TeamEvent[]) {
      if (_.keys(this._eventIdMap).length) {
        return _.filter(events, (e) => this._eventIdMap[e.id]);
      }

      if (this.props.unconfirmed) {
        events = _.filter(events, (e) => Stores.Events.needsConfirmation(e));
      }

      else {
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
          events = Stores.Events.filter(events, this.props.filterStr);
        }
      }

      // Record - remember events
      _.each(events, (e) => this._eventIdMap[e.id] = true);
      return events;
    }

    renderWithData() {
      this.updateModal();
      var eventData = this.getEventData();
      var events = Stores.Events.uniqueEvents(eventData.eventsForRanges);

      // Don't trigger .filterEvents until we're done fetching (otherwise
      // new incoming events won't be shown)
      var filteredEvents = (eventData.isBusy) ? [] : this.filterEvents(events);
      var hiddenEvents = (eventData.isBusy) ? 0 :
        (events.length - filteredEvents.length);

      return <div className="container filter-list">
        <div className="list-selectors">
          <div className="row pad">
            { this.renderCalSelector() }
            { this.renderMonthSelector() }
          </div>
          <div className="row pad">
            { this.renderLabelSelector(events) }
            { this.renderFilterStr() }
          </div>
        </div>
        { this.renderActionMenu(filteredEvents) }
        { this.state.actionsPinned ?
          <div className="list-action-menu-filler esper-section" /> : null }
        { hiddenEvents ? this.renderFilterMsg(hiddenEvents) : null }
        <div className="esper-section esper-full-width">
          { (() => {
            if (eventData.hasError) {
              return <Components.ErrorMsg />;
            }
            if (eventData.isBusy) {
              return <div
                className="esper-spinner" />;
            }
            return this.renderMain(filteredEvents);
          })() }
        </div>
      </div>;
    }

    renderCalSelector() {
      var teams = Stores.Teams.all();
      var calendarsByTeamId = Stores.Calendars.byTeamId();

      return <div className="col-sm-6 pad-xs">
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
      return <div className="col-sm-6 pad-xs">
        <Components.PeriodSelectorWithIcon
          period={this.props.period}
          updateFn={(x) => this.updateRoute({
            period: x
          })}
        />
      </div>;
    }

    renderLabelSelector(events: Stores.Events.TeamEvent[]) {
      var teams = Stores.Teams.getFromCalSelection(this.props.cals);
      var labels = Labels.fromEvents(events, teams);
      labels = Labels.sortLabels(labels);

      var unconfirmedCount = _.filter(events,
        (e) => Stores.Events.needsConfirmation(e)
      ).length;
      return <div className="col-sm-6 pad-xs">
        <Components.LabelSelectorDropdown labels={labels}
          totalCount={events.length}
          unlabeledCount={Labels.countUnlabeled(events)}
          unconfirmedCount={unconfirmedCount}
          selected={this.props.labels.some}
          allSelected={this.props.labels.all}
          unlabeledSelected={this.props.labels.none}
          showUnlabeled={true}
          unconfirmedSelected={this.props.unconfirmed}
          updateFn={(x) => this.updateRoute({
            labels: {
              all: x.all,
              none: x.unlabeled,
              some: x.all ? [] : x.labels
            }
          })}
          onUnconfirmedClick={() => this.updateRoute(this.props.unconfirmed ?
            {
              unconfirmed: false,
              labels: { all: true, none: true, some: [] }
            } : {
              unconfirmed: true,
              labels: { all: false, none: false, some: [] }
            })} />
      </div>;
    }

    renderFilterStr() {
      return <div className="col-sm-6 pad-xs">
        <div className="input-group">
          <span className="input-group-addon">
            <i className="fa fa-fw fa-search" />
          </span>
          <Components.SearchBox
            className="form-control end-of-group"
            placeholder={Text.SearchEventsPlaceholder}
            value={this.props.filterStr}
            onUpdate={(val) => {
              this.updateRoute({
                filterStr: val
              }, { replace: true })
            }}/>
        </div>
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
              {" "}{ Text.SelectAll }
            </span>
          </div>
          {
            this.state.selected.length ?
            <div className="action" onClick={() => this.editSelectedEvents()}>
              <i className="fa fa-fw fa-tag" />
              <span className="hidden-xs">
                {" "}{ Text.EditLabels }
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
      var current = Period.now(this.props.period.interval);
      if (this.props.period.start === current.start) {
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
      this._eventIdMap = {}; // Reset remembered event list
      if (!_.isEmpty(this.props.cals)) {
        Stores.Events.fetchPredictions({
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
        onFeedbackClick={(event) => this.editEvent(event, false)}
        onEventToggle={(event) => this.toggleEvent(event)}
      />;
    }

    editEvent(event: Stores.Events.TeamEvent, minFeedback=true) {
      Actions.EventLabels.confirm([event]);
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

      var teams = Stores.Teams.getFromCalSelection(this.props.cals);
      return <Components.EventEditorModal
        eventData={eventData}
        teams={teams}
        focusOnLabels={minFeedback}
        minFeedback={minFeedback}
        onHidden={() => this.modalDone()} />;
    }

    modalDone() {
      this.clearSelection();
    }

    clearSelection() {
      this.setState({ selected: [] });
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
      period?: Types.Period;
      filterStr?: string;
      labels?: Params.ListSelectJSON;
      unconfirmed?: boolean;
    }, opts: Route.nav.Opts = {}) {
      var pathForCals = Params.pathForCals(newProps.cals || this.props.cals);
      var period = newProps.period || this.props.period;
      var { interval, period: periodStr } = Params.periodStr(period);
      var path = "/list/" + (_.map([
        pathForCals[0],
        pathForCals[1],
        interval, periodStr
      ], encodeURIComponent)).join("/");
      opts.jsonQuery = {
        filterStr: Util.some(newProps.filterStr, this.props.filterStr),
        labels: Util.some(newProps.labels, this.props.labels),
        unconfirmed: newProps.unconfirmed
      } as Params.FilterListJSON;
      Route.nav.path(path, opts);
    }
  }
}
