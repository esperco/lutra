/*
  View for event "search" (really filtering) and drilldown by label
*/

/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <refernece path="./Components.EventEditor.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./Actions.FilterList.tsx" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface FilterListProps {
    calendars: Calendars.CalSelection[];
    start: Date;
    end: Date;

    /*
      Which labels to show -- does a union of all events that have a label
      in the list + special options for showing all labels and showing
      unlabled events
    */
    labels: string[];
    unlabeled: boolean;
    allLabels: boolean;

    // Substring to filter events by (using titles)
    filterStr: string;
  }

  interface FilterListState {
    selected?: Events.TeamEvent[];
    actionsPinned?: boolean;
  }

  function updateRoute(props: FilterListProps, opts?: Route.nav.Opts) {
    var flQS: Actions.FilterListQS = {
      cals: _.map(props.calendars, (c) => ({
        teamId: c.teamId,
        calId: c.calId
      })),
      start: props.start.getTime(),
      end: props.end.getTime(),
      labels: props.labels,
      allLabels: props.allLabels,
      unlabeled: props.unlabeled,
      filterStr: props.filterStr
    };
    Route.nav.query(flQS, opts);
  }

  export class FilterList extends Component<FilterListProps, FilterListState> {
    _actionMenu: HTMLDivElement;
    _actionMenuOffset: number;
    _editModalId: number;
    _editModalEvents: Events.TeamEvent[];

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

    renderWithData() {
      this.updateModal();
      return <div className="container filter-list">
        <div className="list-selectors">
          <div className="row">
            { this.renderCalSelector() }
            { this.renderMonthSelector() }
          </div>
          <div className="row">
            { this.renderLabelSelector() }
            { this.renderFilterStr() }
          </div>
        </div>
        { this.renderActionMenu() }
        { this.renderFilterMsg() }
        { this.renderMain() }
      </div>;
    }

    renderCalSelector() {
      var teams = Teams.all();
      var calendarsByTeamId = (() => {
        var ret: {[index: string]: ApiT.GenericCalendar[]} = {};
        _.each(Teams.all(), (t) => {
          ret[t.teamid] = Calendars.CalendarListStore.val(t.teamid)
        });
        return ret;
      })();

      return <div className="col-sm-6 form-group">
        <Components.CalSelectorDropdownWithIcon
          teams={teams}
          calendarsByTeamId={calendarsByTeamId}
          selected={this.props.calendars}
          updateFn={(x) => updateRoute(_.extend({}, this.props, {
            calendars: x
          }) as FilterListProps)}
        />
      </div>;
    }

    renderMonthSelector() {
      return <div className="col-sm-6 form-group">
        <Components.MonthSelector
          windowStart={this.props.start}
          windowEnd={this.props.end}
          updateFn={(x) => updateRoute(_.extend({}, this.props, {
            start: x.windowStart,
            end: x.windowEnd
          }) as FilterListProps)}
        />
      </div>;
    }

    renderLabelSelector() {
      var events = this.getEvents();
      var labels = Labels.fromEvents(events, Teams.all());
      labels = Labels.sortLabels(labels);
      return <div className="col-sm-6 form-group">
        <div className="esper-clearable">
          <Components.LabelSelectorDropdown labels={labels}
            totalCount={events.length}
            unlabeledCount={Labels.countUnlabeled(events)}
            selected={this.props.labels}
            allSelected={this.props.allLabels}
            unlabeledSelected={this.props.unlabeled}
            showUnlabeled={true}
            updateFn={(x) => updateRoute(_.extend({}, this.props, {
              allLabels: x.all,
              unlabeled: x.unlabeled,
              labels: x.all ? [] : x.labels
            }) as FilterListProps)} />
          {
            !this.props.allLabels ?
            <span className="esper-clear-action" onClick={
              () => updateRoute(_.extend({}, this.props, {
                allLabels: true,
                unlabeled: true,
                labels: []
              }) as FilterListProps)
            }>
              <i className="fa fa-fw fa-times" />
            </span> :
            null
          }
        </div>
      </div>;
    }

    renderFilterStr() {
      return <div className="col-sm-6 form-group">
        <FilterStr value={this.props.filterStr} onUpdate={(val) => {
          updateRoute(_.extend({}, this.props, {
            filterStr: val
          }) as FilterListProps, { replace: true })
        }}/>
      </div>;
    }

    renderFilterMsg() {
      var numFilteredEvents = this.getFilteredEvents().length;
      var numTotalEvents = this.getEvents().length;
      if (numTotalEvents === numFilteredEvents) {
        return;
      }

      return <div className="list-filter-msg">
        <span className="muted">
          {numTotalEvents - numFilteredEvents} Events Not Shown
        </span>
        <span className="pull-right action esper-clear-action" onClick={
          () => this.resetFilters()
        }>
          <i className="fa fa-times" />
        </span>
      </div>;
    }

    renderActionMenu() {
      var icon = (() => {
        if (this.isAllSelected()) {
          return "fa-check-square-o";
        } else if (this.isSomeSelected()) {
          return "fa-minus-square-o";
        }
        return "fa-square-o";
      })();

      return <div ref={(c) => this._actionMenu = c} className={
        "list-action-menu" + (this.state.actionsPinned ? " pinned" : "")
      }>
        <div className="list-action-menu-container">
          <div className="action" onClick={() => this.toggleAll()}>
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

    getStats() {
      var events = this.state.selected;
      if (! events.length) {
        return;
      }
      var duration = TimeStats.aggregateDuration(events);

      return <div className="event-stats">
        { events.length }{" "}Events,{" "}
        { Util.roundStr(TimeStats.toHours(duration), 2) }{" "}Hours
      </div>;
    }

    getEvents() {
      return _.filter(_.flatten(
        _.map(this.props.calendars, (c) =>
          Events.get(c.teamId, c.calId, this.props.start, this.props.end)
        )));
    }

    getFilteredEvents() {
      var events = this.getEvents();
      if (! this.props.allLabels) {
        events = _.filter(events, (e) =>
          (this.props.unlabeled && e.labels_norm.length === 0) ||
          (_.intersection(this.props.labels, e.labels_norm).length > 0)
        );
      }

      if (this.props.filterStr) {
        events = _.filter(events,
          (e) => _.includes(e.title.toLowerCase(),
                            this.props.filterStr.toLowerCase())
        );
      }

      return events;
    }

    resetFilters() {
      updateRoute(_.extend({}, this.props, {
        allLabels: true,
        unlabeled: true,
        filterStr: null,
        labels: []
      }) as FilterListProps);
    }

    refreshEvents() {
      _.each(this.props.calendars, (c) =>
        Events.fetch(c.teamId, c.calId, this.props.start, this.props.end, true)
      );
    }

    renderMain() {
      if (this.hasError()) {
        return <Components.ErrorMsg />;
      }

      if (! this.isReady()) {
        return <div className="esper-spinner esper-centered esper-large" />;
      }

      var events = this.getFilteredEvents();
      if (events.length === 0) {
        return <div className="esper-no-content">
          No events found
        </div>;
      }

      var groupByDays = _.groupBy(events,
        (e) => moment(e.start).clone().startOf('day').valueOf()
      );
      var sortedKeys = _.sortBy(_.keys(groupByDays), (k) => parseInt(k));

      return <div>
        {
          _.map(sortedKeys, (k) =>
            this.renderDay(parseInt(k), groupByDays[k])
          )
        }
      </div>;
    }

    renderDay(timestamp: number, events: Events.TeamEvent[]) {
      var m = moment(timestamp);
      return <div className="day" key={timestamp}>
        <div className="day-title">{ m.format("MMM D - dddd") }</div>
        <div className="list-group">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Events.TeamEvent) {
      return <div key={Events.storeId(event)} className="list-group-item event">
        <div className="event-checkbox"
             onClick={() => this.toggleEvent(event)}>
          { this.isSelected(event) ?
            <i className="fa fa-fw fa-check-square-o" /> :
            <i className="fa fa-fw fa-square-o" />
          }
        </div>
        <div className="event-content">
          <div className={"title esper-link" +
                 (event.feedback.attended === false ? " no-attend" : "")}
               onClick={() => this.editEvent(event)}>
            {event.title}
          </div>
          <div className="time">
            <span className="start">
              { moment(event.start).format("h:mm a") }
            </span>{" to "}<span className="end">
              { moment(event.end).format("h:mm a") }
            </span>{" "}
            { event.recurring_event_id ?
              <span className="recurring" title="Recurring">
                <i className="fa fa-fw fa-refresh" />
              </span> :
              null
            }
          </div>
          <div className="event-rating">
            { _.times((event.feedback.attended !== false &&
                       event.feedback.rating) || 0, (i) =>
              <i key={i.toString()} className="fa fa-fw fa-star" />
            )}
          </div>
          <div className="event-labels">
            { _.map(event.labels_norm,
              (l, i) => this.renderLabel(l, event.labels[i])
            ) }
          </div>
        </div>
      </div>;
    }

    renderLabel(id: string, displayAs: string) {
      var labelColor = Colors.getColorForLabel(id)
      var style = {
        background: labelColor,
        color: Colors.colorForText(labelColor)
      };

      var onClick = () => updateRoute(_.extend({}, this.props, {
        labels: [id],
        unlabeled: false,
        allLabels: false
      }) as FilterListProps);

      return <span style={style} key={id} className="event-label"
        onClick={onClick}
      >
        <i className="fa fa-fw fa-tag" />{" "}
        {displayAs}
      </span>;
    }

    hasError() {
      return !!_.find(this.props.calendars, (c) =>
        Events.status(c.teamId, c.calId, this.props.start, this.props.end)
          .match({
            none: () => false,
            some: (s) => s === Model.DataStatus.FETCH_ERROR ||
                         s === Model.DataStatus.PUSH_ERROR
          })
      );
    }

    isReady() {
      return  !!_.find(this.props.calendars, (c) =>
        Events.status(c.teamId, c.calId, this.props.start, this.props.end)
          .match({
            none: () => false,
            some: (s) => s === Model.DataStatus.READY
          })
      );
    }

    editEvent(event: Events.TeamEvent) {
      this.renderModal([event]);
    }

    editSelectedEvents() {
      this.renderModal(this.state.selected);
    }

    renderModal(events: Events.TeamEvent[]) {
      this._editModalEvents = events;
      this._editModalId = Layout.renderModal(this.getModal(events));
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

    getModal(events: Events.TeamEvent[]) {
      // Refresh data from store before rendering modal
      var eventPairs = _.filter(_.map(events, (e) =>
        Events.EventStore.get(Events.storeId(e))
      ));
      var teamPairs = _.map(Teams.all(),
        (t) => Option.cast(Teams.teamStore.metadata(t.teamid))
          .match<[ApiT.Team, Model.StoreMetadata]>({
            none: () => null,
            some: (m) => [t, m]
          }));

      return <Components.EventEditorModal eventPairs={eventPairs}
                                          teamPairs={teamPairs} />;
    }

    toggleEvent(event: Events.TeamEvent) {
      var selected = this.state.selected;
      var index = this.findIndex(event);
      if (index >= 0) {
        selected = _.filter(selected, (s) => !Events.matchRecurring(event, s));
      } else {
        selected = selected.concat([event]);
      }
      this.setState({
        selected: selected
      });
    }

    isSelected(event: Events.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Events.TeamEvent) {
      return _.findIndex(this.state.selected, (e) =>
        Events.matchRecurring(e, event)
      );
    }

    toggleAll() {
      if (this.isSomeSelected()) {
        this.setState({ selected: [] })
      } else {
        this.setState({ selected: this.getFilteredEvents() })
      }
    }

    isAllSelected() {
      return this.state.selected.length &&
        _.every(this.getFilteredEvents(), (e) => this.isSelected(e));
    }

    isSomeSelected() {
      return this.state.selected.length &&
        !!_.find(this.getFilteredEvents(), (e) => this.isSelected(e));
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
            value={this.state.value || null}
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
      this.props.onUpdate(null);
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
