/*
  View for event "search" (really filtering) and drilldown by label
*/

/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <refernece path="./Components.EventEditor.tsx" />
/// <reference path="./Components.PeriodSelector.tsx" />
/// <reference path="./Events2.ts" />
/// <reference path="./Actions.FilterList.tsx" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface FilterListProps extends Actions.FilterListJSON {
    teamId: string;
    calIds: string[];
    period: Period.Single;
  }

  interface FilterListState {
    selected?: Events2.TeamEvent[];
    actionsPinned?: boolean;
  }

  function updateRoute(props: FilterListProps, opts: Route.nav.Opts = {}) {
    var path = "/list/" + (_.map([
      props.teamId,
      props.calIds.join(","),
      props.period.interval[0],
      props.period.index.toString()
    ], encodeURIComponent)).join("/");
    opts.jsonQuery = {
      filterStr: props.filterStr,
      labels: props.labels
    } as Actions.FilterListJSON;
    Route.nav.path(path, opts);
  }

  export class FilterList extends Component<FilterListProps, FilterListState> {
    _actionMenu: HTMLDivElement;
    _actionMenuOffset: number;
    _editModalId: number;
    _editModalEvents: Events2.TeamEvent[];

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

    getEventData() {
      // Merge event lists for multiple calendars
      var eventData = Option.flatten(
        _.map(this.props.calIds, (calId) =>
          Events2.getForPeriod({
            teamId: this.props.teamId,
            calId: calId,
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

    filterEvents(events: Events2.TeamEvent[]) {
      if (! this.props.labels.all) {
        events = _.filter(events, (e) =>
          (this.props.labels.none && e.labels_norm.length === 0) ||
          (_.intersection(this.props.labels.some, e.labels_norm).length > 0)
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
          allowMulti={true}
          calendarsByTeamId={calendarsByTeamId}
          selected={_.map(this.props.calIds, (calId) => ({
            teamId: this.props.teamId, calId: calId
          }))}
          updateFn={(x) => updateRoute(_.extend({}, this.props, x.length > 0 ?
            {
              teamId: x[0].teamId,
              calIds: _.map(x, (s) => s.calId)
            } : {
              teamId: null,
              calIds: null
            }) as FilterListProps)}
        />
      </div>;
    }

    renderMonthSelector() {
      return <div className="col-sm-6 form-group">
        <Components.PeriodSelector
          period={this.props.period}
          updateFn={(x) => updateRoute(_.extend({}, this.props, {
            period: x
          }) as FilterListProps)}
        />
      </div>;
    }

    renderLabelSelector(events: Events2.TeamEvent[]) {
      var labels = Labels.fromEvents(events, Teams.all());
      labels = Labels.sortLabels(labels);
      return <div className="col-sm-6 form-group">
        <div className="esper-clearable">
          <Components.LabelSelectorDropdown labels={labels}
            totalCount={events.length}
            unlabeledCount={Labels.countUnlabeled(events)}
            selected={this.props.labels.some}
            allSelected={this.props.labels.all}
            unlabeledSelected={this.props.labels.none}
            showUnlabeled={true}
            updateFn={(x) => updateRoute(_.extend({}, this.props, {
              labels: {
                all: x.all,
                none: x.unlabeled,
                some: x.all ? [] : x.labels,
                unmatched: false
              }
            }) as FilterListProps)} />
          {
            !this.props.labels.all ?
            <span className="esper-clear-action" onClick={
              () => updateRoute(_.extend({}, this.props, {
                labels: {
                  all: true,
                  none: true,
                  some: [],
                  unmatched: false
                }
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

    renderActionMenu(events: Events2.TeamEvent[]) {
      var icon = (() => {
        if (this.isAllSelected(events)) {
          return "fa-check-square-o";
        } else if (this.isSomeSelected(events)) {
          return "fa-minus-square-o";
        }
        return "fa-square-o";
      })();

      return <div ref={(c) => this._actionMenu = c} className={
        "list-action-menu" + (this.state.actionsPinned ? " pinned" : "")
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

    resetFilters() {
      updateRoute(_.extend({}, this.props, {
        allLabels: true,
        unlabeled: true,
        filterStr: null,
        labels: []
      }) as FilterListProps);
    }

    refreshEvents() {
      _.each(this.props.calIds, (c) =>
        Events2.fetchForPeriod({
          teamId: this.props.teamId,
          calId: c,
          period: this.props.period,
          force: true
        })
      );
    }

    renderMain(events: Events2.TeamEvent[]) {
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

    renderDay(timestamp: number, events: Events2.TeamEvent[]) {
      var m = moment(timestamp);
      return <div className="day" key={timestamp}>
        <div className="day-title">{ m.format("MMM D - dddd") }</div>
        <div className="list-group">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Events2.TeamEvent) {
      return <div key={[event.teamId, event.calendar_id, event.id].join(",")}
                  className="list-group-item event">
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
              (l, i) => this.renderLabel(event, l, event.labels[i])
            ) }
          </div>
        </div>
      </div>;
    }

    renderLabel(event: Events2.TeamEvent, id: string, displayAs: string) {
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
      var clearLabel = ((e: __React.MouseEvent) => {
        e.stopPropagation();
        EventLabelChange.remove([event], displayAs);
      });

      return <span style={style} key={id} className="event-label"
        onClick={onClick}
      >
        <i className="fa fa-fw fa-tag" />{" "}
        {displayAs}
        <span className="hidden-xs esper-clear-action"
              onClick={(e) => clearLabel(e)}>{" "}
          <i className="fa fa-fw fa-times" />
        </span>
      </span>;
    }

    editEvent(event: Events2.TeamEvent) {
      this.renderModal([event]);
    }

    editSelectedEvents() {
      this.renderModal(this.state.selected);
    }

    renderModal(events: Events2.TeamEvent[]) {
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

    getModal(events: Events2.TeamEvent[]) {
      // Refresh data from store before rendering modal
      var eventData = _(events)
        .map((e) => Events2.EventStore.get({
          teamId: e.teamId,
          calId: e.calendar_id,
          eventId: e.id
        }))
        .filter((e) => e.isSome())
        .map((e) => e.unwrap())
        .value();
      var teamPairs = _.map(Teams.all(),
        (t) => Option.cast(Teams.teamStore.metadata(t.teamid))
          .match<[ApiT.Team, Model.StoreMetadata]>({
            none: () => null,
            some: (m) => [t, m]
          }));

      return <Components.EventEditorModal eventData={eventData}
                                          teamPairs={teamPairs} />;
    }

    toggleEvent(event: Events2.TeamEvent) {
      var selected = this.state.selected;
      var index = this.findIndex(event);
      if (index >= 0) {
        selected = _.filter(selected, (s) => !Events2.matchRecurring(event, s));
      } else {
        selected = selected.concat([event]);
      }
      this.setState({
        selected: selected
      });
    }

    isSelected(event: Events2.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Events2.TeamEvent) {
      return _.findIndex(this.state.selected, (e) =>
        Events2.matchRecurring(e, event)
      );
    }

    toggleAll(events: Events2.TeamEvent[]) {
      if (this.isSomeSelected(events)) {
        this.setState({ selected: [] })
      } else {
        this.setState({ selected: events })
      }
    }

    isAllSelected(events: Events2.TeamEvent[]) {
      return this.state.selected.length &&
        _.every(events, (e) => this.isSelected(e));
    }

    isSomeSelected(events: Events2.TeamEvent[]) {
      return this.state.selected.length &&
        !!_.find(events, (e) => this.isSelected(e));
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
