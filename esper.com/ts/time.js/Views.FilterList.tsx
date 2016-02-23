/*
  View for event "search" (really filtering) and drilldown by label
*/

/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <refernece path="./Components.LabelEditor2.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./Actions.FilterList.tsx" />

module Esper.Views {
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

  export class FilterList
      extends ReactHelpers.Component<FilterListProps, FilterListState>
  {
    _actionMenu: HTMLDivElement;
    _actionMenuOffset: number;

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
        { this.renderMain() }
      </div>;
    }

    renderCalSelector() {
      return <div className="col-sm-6 form-group">
        <Components.CalSelectorDropdown
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
      var labels = _.sortBy(Labels.fromEvents(events), (l) => -l.count);
      return <div className="col-sm-6 form-group">
        <Components.LabelSelectorDropdown labels={labels}
          totalCount={events.length}
          unlabeledCount={Labels.countUnlabeled(events)}
          selected={this.props.labels}
          allSelected={this.props.allLabels}
          unlabeledSelected={this.props.unlabeled}
          updateFn={(x) => updateRoute(_.extend({}, this.props, {
            allLabels: x.all,
            unlabeled: x.unlabeled,
            labels: x.all ? [] : x.labels
          }) as FilterListProps)} />
      </div>;
    }

    renderFilterStr() {
      return <div className="col-sm-6 form-group">
        <div className="input-group">
          <span className="input-group-addon">
            <i className="fa fa-fw fa-search" />
          </span>
          <input type="text" className="form-control"
            placeholder="Search Title"
            defaultValue={this.props.filterStr || null}
            onKeyUp={(e) => updateRoute(_.extend({}, this.props, {
              filterStr: (e.target as HTMLInputElement).value
            }) as FilterListProps, { delay: 500, replace: true })} />
        </div>
      </div>;
    }

    renderActionMenu() {
      return <div ref={(c) => this._actionMenu = c} className={
        "list-action-menu" + (this.state.actionsPinned ? " pinned" : "")
      }>
        <div className="list-action-menu-container">
          <div className="action" onClick={() => this.toggleAll()}>
            <span className="event-checkbox">
              <i className={"fa fa-fw " +
                (this.isAllSelected() ? "fa-check-square-o" : "fa-square-o")
              } />
            </span>
            {" "}Select All
          </div>
          {
            this.state.selected.length ?
            <div className="action" onClick={() => this.editSelectedEvents()}>
              <i className="fa fa-fw fa-tag" />{" "}Label
            </div> :
            null
          }
          <div className="action pull-right"
               onClick={() => this.refreshEvents()}>
            <i className="fa fa-fw fa-refresh" />
          </div>
        </div>
      </div>
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
        { this.renderActionMenu() }
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
          <div className="title esper-link"
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
      Layout.renderModal(<Components.LabelEditorModal events={[event]} />);
    }

    editSelectedEvents() {
      Layout.renderModal(<Components.LabelEditorModal
        events={this.state.selected}
      />);
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
      if (this.isAllSelected()) {
        this.setState({ selected: [] })
      } else {
        this.setState({ selected: this.getFilteredEvents() })
      }
    }

    isAllSelected() {
      return this.state.selected.length &&
        _.every(this.getFilteredEvents(), (e) => this.isSelected(e));
    }
  }
}
