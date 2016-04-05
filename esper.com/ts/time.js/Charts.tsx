/*
  Abstractions for managing different chart types
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Actions.tsx" />

module Esper.Charts {
  export interface EventChartParams<T extends Actions.RelativePeriodJSON> {
    chartId: string;
    cals: Calendars.CalSelection[];
    period: Period.Single;
    filterParams: T
  }

  export interface DefaultEventChartParams
    extends EventChartParams<Actions.RelativePeriodJSON> { }

  /*
    Event wrappers grouped by some attribute on the wrapper, with a period
    variable
  */
  export interface GroupsByPeriod<W> {
    period: Period.Single;
    groups: EventStats.DurationsGrouping<W>;
  }

  export abstract class EventChart<T extends Actions.RelativePeriodJSON> {
    protected events: Events2.TeamEvent[]; // Unique events across all periods
    protected eventsByPeriod: {            // Events for a single period
      period: Period.Single;
      events: Events2.TeamEvent[];
    }[];
    protected error: boolean;
    protected busy: boolean;
    public params: EventChartParams<T>;

    constructor(params: DefaultEventChartParams) {
      this.params = _.extend(params, {
        filterParams: this.cleanFilterParams(params.filterParams)
      }) as EventChartParams<T>;
    }

    // Optional function for cleaning filter params depending on its def'n
    cleanFilterParams(params: any = {}): T {
      params = params || {};
      var ret = params as T;
      return Actions.cleanRelativePeriodJSON(ret) as T;
    }

    // Incrs to allow (0 is implied)
    allowedIncrs(): number[] {
      return [];
    }

    // Should return a list of relative period indices to fetch / get for
    periodIncrs() {
      var ret = _.intersection(
        this.allowedIncrs(),
        this.params.filterParams.incrs
      );
      if (! _.includes(ret, 0)) {
        ret = [0].concat(ret);
      }
      return ret;
    }

    // Fetch data from API if necessary
    async() {
      _.each(this.periodIncrs(), (i) => this.fetchRelative(i));
    }

    /*
      Helper for children to fetch previous or future periods as necessary.
      Fetch positive to get in future, negative for past
    */
    fetchRelative(incr: number) {
      var fetchPeriod = this.relativePeriod(incr);
      _.each(this.params.cals, (cal) => {
        Events2.fetchForPeriod({
          teamId: cal.teamId,
          calId: cal.calId,
          period: fetchPeriod
        });
      });
    }

    relativePeriod(incr: number) {
      var rp = _.clone(this.params.period);
      rp.index += incr;
      return rp;
    }

    // Fetch event data, merge from multiple calendars, then cache -- this
    // should get called *once* per render
    sync() {
      // Reset
      this.busy  = false;
      this.error = false;
      this.eventsByPeriod = [];
      this.events = [];

      // Re-populate
      _.each(this.periodIncrs(), (i) => {
        var data = this.getRelative(i);
        this.busy  = this.busy  || data.busy;
        this.error = this.error || data.error;
        this.eventsByPeriod.push({
          period: this.relativePeriod(i),
          events: data.events
        });
        this.events = this.events.concat(data.events);
      });

      // Events should be unique
      if (this.eventsByPeriod.length > 1) {
        this.events = _.uniqBy(this.events,
          (e) => [e.teamId, e.calendar_id, e.id].join("|")
        );
      }
    }

    /*
      Like fetchRelative, but for getting data from stores
    */
    getRelative(incr: number) {
      var fetchPeriod = this.relativePeriod(incr);
      var data = Option.flatten(
        _.map(this.params.cals, (cal) =>
          Events2.getForPeriod({
            teamId: cal.teamId,
            calId: cal.calId,
            period: fetchPeriod
          })
        )
      );
      var events = _.flatten(_.map(data, (d) => d.events));
      events = this.filterEvents(events, this.params.filterParams);

      return {
        events: events,
        busy: !!_.find(data, (d) => d.isBusy),
        error: !!_.find(data, (d) => d.hasError),
        period: fetchPeriod
      };
    }

    /*
      Helper function to wrap each event, get durations based on period,
      and then group by a list of criteria
    */
    getGroupsByPeriod<W extends EventStats.HasEvent>(
      wrapFn: (e: Events2.TeamEvent) => Option.T<W>,
      groupFn: (e: W & EventStats.HasDurations) => string[]
    ): GroupsByPeriod<W>[] {
      return _.map(this.eventsByPeriod, (e) => {
        var bounds = Period.boundsFromPeriod(e.period);
        var durations = EventStats.wrapWithDurations(e.events, wrapFn, {
          truncateStart: bounds[0],
          truncateEnd: bounds[1]
        });

        var groups = Partition.groupByMany(durations, groupFn);

        return {
          period: e.period,
          groups: groups
        };
      });
    }

    /*
      Helper function to get a complete list of keys across *all* periods
      but sorted by attribute of *current* period
    */
    sortByForCurrentPeriod<W>(
      periodGroups: GroupsByPeriod<W>[],
      sortFn: (w: W & EventStats.HasDurations) => number
    ): string[] {
      var matchesThisPeriod = Util.matches(periodGroups,
        (d) => _.isEqual(d.period, this.params.period)
      );
      var sortedLabels = _(matchesThisPeriod.some[0].groups.some)
        .sortBy((s) => _.sumBy(s.items, sortFn))
        .map((s) => s.key)
        .value();

      _.each(matchesThisPeriod.none, (n) => {
        sortedLabels = sortedLabels.concat(
          _.map(n.groups.some, (s) => s.key)
        )
      });
      return _.uniq(sortedLabels);
    }

    // Auto-filter team events, by default just remove not attended events
    filterEvents(events: Events2.TeamEvent[], filterParams: T) {
      return _.filter(events, (e) => e.feedback.attended !== false);
    }

    // Returns any error retrieved while loading, if applicable
    // Else returns null.
    hasError() {
      return this.error;
    }

    // Returns true if loading data. Called after getError
    isBusy() {
      return this.busy;
    }

    // Return true if no data
    noData() {
      return !_.flatten(this.eventsByPeriod).length;
    }

    // Message to show when no data is avilable
    noDataMsg(): JSX.Element {
      return <span>No data found</span>;
    }

    // Render a chart based on filtered events
    abstract renderChart(): React.ReactElement<any>;

    // Render additional selector in left column (if any) to refine chart
    // data (like label selectors). Must handle lack of store data safely.
    renderSelectors(): React.ReactElement<any> {
      if (this.allowedIncrs().length) {
        return <div className="esper-menu-section">
          <div className="esper-subheader">
            <i className="fa fa-fw fa-clock-o" />{" "}
            Compare With
          </div>
          <Components.RelativePeriodSelector
            period={this.params.period}
            allowedIncrs={this.allowedIncrs()}
            selectedIncrs={this.periodIncrs()}
            updateFn={(x) => this.updateParams({
              incrs: x
            })}
          />
        </div>;
      }
      return <span />;
    }

    // Return which intervals should be shown
    intervalsAllowed(): Period.Interval[] {
      return ["week", "month", "quarter"];
    }

    // Helper function to update params
    updateParams(vals: {
      incrs?: number[]
    }) {
      var newParams = _.cloneDeep(this.params.filterParams);
      if (vals.incrs) {
        newParams.incrs = vals.incrs;
      }
      Route.nav.query(newParams);
    }
  }

  export abstract class DefaultEventChart
    extends EventChart<Actions.RelativePeriodJSON> { }


  /* Misc chart helpers */

  export function eventPointFormatter(): string {
    var point: HighchartsPointObject = this;
    var ret = "";
    ret += point.y.toString();
    ret += " / ";
    var totalHours = _.sumBy(point.series.data, (p) => p.y);
    ret += Text.hours(totalHours);
    ret += ` (${Text.events(point.series.data.length)})`
    return ret;
  }

  export var eventPointTooltip: HighchartsTooltipOptions = {
    formatter: null,
    pointFormatter: eventPointFormatter
  };

  export function countPointFormatter(): string {
    var point: HighchartsPointObject = this;
    var ret = "";
    ret += Text.hours(this.hours || this.y);
    if (this.count) {
      ret += " / " + Text.events(this.count);
    }
    if (this.percentage) {
      ret += ` (${Util.roundStr(this.percentage, 1)}%)`;
    }
    return ret;
  }

  export var countPointTooltip: HighchartsTooltipOptions = {
    formatter: null,
    pointFormatter: countPointFormatter
  }
}
