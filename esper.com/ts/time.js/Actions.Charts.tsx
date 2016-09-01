/*
  Actions for charts page
*/

module Esper.Actions.Charts {
  // Rename types defined in Charting module
  type BaseOpts<T> = Charting.BaseOpts<T>;
  type ExtraOpts = Charting.ExtraOpts;
  type PeriodList = Charting.PeriodData<Stores.Events.EventListData>;

  // Fetch events from server
  function fetchEvents<T>(o: BaseOpts<T>) {
    var periods = Period.withIncrs(o.period, o.extra.incrs);
    _.each(periods, (p) => Stores.Events.fetchPredictions({
      teamId: o.teamId,
      period: p
    }));
  }

  // Fetch events + metadata for one or more periods
  function getEventData<T>(o: BaseOpts<T>): PeriodList[] {
    var periods = _.sortBy(
      Period.withIncrs(o.period, o.extra.incrs),
      Period.asNumber
    );
    var cals = _.map(o.calIds, (calId) => ({
      teamId: o.teamId,
      calId: calId
    }));

    return _.map(periods, (p) => ({
      period: p,
      current: _.isEqual(p, o.period),
      total: o.extra.incUnscheduled ?
        WeekHours.totalForPeriod(p, o.extra.weekHours) : 0,
      data: Stores.Events.require({
        cals: cals,
        period: p
      })
    }));
  }

  // Different get function for calendar grid view (sorted by day)
  function getForMonth<T>(o: BaseOpts<T>) {
    return Stores.Events.requireByDate({
      cals: _.map(o.calIds, (calId) => ({
        teamId: o.teamId,
        calId: calId
      })),
      period: o.period
    });
  }

  function toMonth(p: Period.Single|Period.Custom): Period.Single {
    if (p.interval === "month") {
      return p as Period.Single;
    }
    return Period.singleFromDate("month", Period.boundsFromPeriod(p)[0]);
  }

  /*
    Some cleaning should happen in routing, but this makes additional changes
    based on extra vars
  */
  function fetchAndClean(o: BaseOpts<{}>) {
    o.extra = Charting.cleanExtra(o.extra, o.pathFn);
    if (o.extra.type === "calendar") {
      o.period = toMonth(o.period);
    }
    fetchEvents(o);
  }

  function initChart(o: BaseOpts<{}>) {
    fetchAndClean(o);
    trackChart(o);
  }

  function eventsFromData(data: PeriodList[]|Stores.Events.EventDateData)
    : Stores.Events.TeamEvent[]
  {
    let eventData: Stores.Events.TeamEvent[][] =
      data.hasOwnProperty('dates') ?
        _.map((data as Stores.Events.EventDateData).dates, (d) => d.events) :
        _.map(data as PeriodList[], (d) => d.data.events);
    return _.flatten(eventData);
  }


  /* Analytics */

  var analyticsId = "chart-analytics-id";

  function trackChart(o: BaseOpts<{}>) {
    /*
      Determine group based on path -- we assume all chart routes start with
      the chart prefix
    */
    var prefix = Paths.Time.charts().hash;
    var sliced = Route.current.slice(prefix.length);
    var parts = sliced.split("/");

    // If [0] is empty (path started with "/"), go to next
    var group = parts[0] || parts[1];

    // Delay tracking by 2 seconds to ensure user is actually looking at chart
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.TimeStatsCharts, {
        group: group,
        type: o.extra.type,
        params: o.extra,
        interval: o.period.interval
      });
    }, 2000);
  }


  /* Puts together our basic chart view and standard selectors */

  function getChartView(o: BaseOpts<{}>, p: {
    chart: JSX.Element;
    events: Stores.Events.TeamEvent[];
    selectors?: JSX.Element[];
    menus?: Types.ChartViewMenu[];
  }) {
    let labelCalc = new EventStats.LabelCountCalc(p.events, o.extra);

    // Automatically open the confirmation modal the first time
    labelCalc.onceChange(function(r) {
      if (autoLaunchConfirm && r.unconfirmedCount) {
        launchConfirmModal(r.unconfirmed);
      }
    });

    var confirmationMenu: Types.ChartViewMenu = {
      id: "confirm",
      tab: <Components.ConfirmBadge
        events={p.events}
        calculation={labelCalc}
      />,
      onClick: () => {
        labelCalc.getResults().match({
          none: () => null,
          some: (r) => launchConfirmModal(r.unconfirmed)
        });
        return false;
      }
    };

    var team = Stores.Teams.require(o.teamId);
    if (! team) { return <span />; }

    var cals = Option.matchList(Stores.Calendars.list(o.teamId));
    var selectors = [
      cals.length <= 1 ? null :
      <Components.CalCalcSelector key="calendars"
        primary={o.pathFn === Paths.Time.calendarsChart}
        calendars={cals}
        selectedIds={o.calIds}
        calculation={new EventStats.CalendarCountCalc(p.events, o.extra)}
        updateFn={(calIds) => Charting.updateChart(o, { calIds: calIds })}
      />,

      <Components.LabelCalcSelector key="labels"
        primary={o.pathFn === Paths.Time.labelsChart}
        team={team}
        selected={o.extra.labels}
        calculation={labelCalc}
        updateFn={(x) => Charting.updateChart(o, { extra: {labels: x} })}
      />,

      <Components.DomainSelector key="guests"
        primary={o.pathFn === Paths.Time.guestsChart}
        selected={o.extra.domains}
        calculation={new EventStats.DomainCountCalc(p.events, o.extra)}
        updateFn={(domains) => Charting.updateChart(o, {
          extra: {
            domains: domains,

            // Guest count none and domain none should be the same
            guestCounts: _.extend({}, o.extra.guestCounts, {
              none: domains.none
            }) as Params.ListSelectJSON
          }
        })}
      />,

      <Components.RatingSelector key="ratings"
        primary={o.pathFn === Paths.Time.ratingsChart}
        selected={o.extra.ratings}
        calculation={new EventStats.RatingCountCalc(p.events, o.extra)}
        updateFn={(x) => Charting.updateChart(o, { extra: {ratings: x} })}
      />,

      <Components.DurationSelector key="durations"
        primary={o.pathFn === Paths.Time.durationsChart}
        selected={o.extra.durations}
        calculation={new EventStats.DurationBucketCalc(p.events, o.extra)}
        updateFn={(x) => Charting.updateChart(o, { extra: { durations: x }})}
      />,

      <Components.GuestCountSelector key="guest-counts"
        primary={o.pathFn === Paths.Time.guestsCountChart}
        selected={o.extra.guestCounts}
        calculation={new EventStats.GuestCountBucketCalc(p.events, o.extra)}
        updateFn={(x) => Charting.updateChart(o, { extra: { guestCounts: x }})}
      />,

      <Components.WeekHourSelector key="weekHours"
        hours={o.extra.weekHours}
        updateHours={
          (x) => Charting.updateChart(o, { extra: { weekHours: x }})
        }
        showUnscheduled={o.extra.type === "percent"}
        unscheduled={o.extra.incUnscheduled}
        updateUnscheduled={
          (x) => Charting.updateChart(o, { extra: { incUnscheduled: x }})
        }
      />,

      o.extra.type === "calendar" ? null :
      <Components.RelativePeriodSidebarSelector key="incrs"
        period={o.period}
        allowedIncrs={[-1, 1]}
        selectedIncrs={o.extra.incrs}
        updateFn={(x) => Charting.updateChart(o, { extra: { incrs: x }})}
      />
    ];

    return <Views.Charts
      chart={p.chart}
      selectors={selectors.concat(p.selectors || [])}
      menus={[confirmationMenu].concat(p.menus || [])}
      { ...o }
    />;
  }

  var autoLaunchConfirm = true; // This gets set to false after first launch.

  function launchConfirmModal(events: Stores.Events.TeamEvent[]) {
    autoLaunchConfirm = false;
    Layout.renderModal(
      Containers.confirmListModal(events)
    );
  }


  /* Misc helpers */

  function getChart<T>(o: BaseOpts<T>, p: {
    cal: (data: Stores.Events.EventDateData) => JSX.Element;
    pct: (data: PeriodList[]) => JSX.Element;
    abs: (data: PeriodList[]) => JSX.Element;
  }) {
    if (o.extra.type === "calendar") {
      let data = getForMonth(o);
      return {
        chart: p.cal(data),
        events: eventsFromData(data)
      };
    }

    else {
      let data = getEventData(o);
      return {
        chart: o.extra.type === "percent" ?
               p.pct(data) : p.abs(data),
        events: eventsFromData(data)
      };
    }
  }

  // Convert period data to calc data format used in Components.Charts.
  function getPeriodCalcData<R, P> (
    o: BaseOpts<P>,
    data: PeriodList[],
    getCalc: (events: Stores.Events.TeamEvent[])
      => EventStats.CalcBase<R /* results */, P /* props */>)
    : (Types.PeriodData<EventStats.CalcBase<R, P>> & Types.HasStatus)[]
  {
    return _.map(data, (d) => ({
      period: d.period,
      current: d.current,
      isBusy: d.data.isBusy,
      hasError: d.data.hasError,
      data: getCalc(d.data.events),
      total: d.total
    }));
  }


  /* Duration Charts */

  export function renderDurations(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.DurationBucketCalc(events, o.extra)
    );
    render(ReactHelpers.contain(function() {
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.DurationEventGrid
          calculation={
            new EventStats.DateDurationBucketCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) =>
          <Components.DurationPercentChart periods={getCalc(data)} />,
        abs: (data) =>
          <Components.DurationHoursChart periods={getCalc(data)} />,
      });

      return getChartView(o, {
        chart,
        events: events
      });
    }));
  }


  /* Calendars Charts */

  export function renderCalendars(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.CalendarDurationCalc(events, o.extra)
    );
    render(ReactHelpers.contain(function() {
      var calendars = Option.matchList(Stores.Calendars.list(o.teamId));
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.CalendarEventGrid
          calendars={calendars}
          calculation={
            new EventStats.CalendarDateDurationCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) => <Components.CalendarPercentChart
          calendars={calendars} periods={getCalc(data)}
        />,
        abs: (data) => <Components.CalendarHoursChart
          calendars={calendars} periods={getCalc(data)}
        />,
      });

      return getChartView(o, {
        chart,
        events: events
      });
    }));
  }


  /* Guest Charts */

  export function renderGuests(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.GuestDurationCalc(events,
        _.extend({}, o.extra, {
          // Nest domains for pie chart
          nestByDomain: o.extra.type === "percent"
        }) as EventStats.DomainNestOpts
      )
    );
    render(ReactHelpers.contain(function() {
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.DomainEventGrid
          calculation={
            new EventStats.DomainDurationByDateCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) => <Components.GuestPercentChart periods={getCalc(data)} />,
        abs: (data) => <Components.GuestHoursChart periods={getCalc(data)} />,
      });

      return getChartView(o, { chart, events });
    }));
  }


  /* Guest Count Charts */

  export function renderGuestsCount(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.GuestCountDurationCalc(events, o.extra)
    );
    render(ReactHelpers.contain(function() {
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.GuestCountEventGrid
          calculation={
            new EventStats.DomainDurationByDateCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) => <Components.GuestCountPercentChart
          periods={getCalc(data)}
        />,
        abs: (data) => <Components.GuestCountHoursChart
          periods={getCalc(data)}
        />,
      });
      return getChartView(o, { chart, events });
    }));
  }


  /* Label Charts */

  export function renderLabels(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.LabelDurationCalc(events, o.extra)
    );
    render(ReactHelpers.contain(function() {
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.LabelEventGrid
          calculation={
            new EventStats.LabelDurationByDateCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) => <Components.LabelPercentChart periods={getCalc(data)} />,
        abs: (data) => <Components.LabelHoursChart periods={getCalc(data)} />,
      });

      return getChartView(o, {chart, events});
    }));
  }


  /* Rating Charts */

  export function renderRatings(o: BaseOpts<{}>) {
    initChart(o);

    var getCalc = (data: PeriodList[]) => getPeriodCalcData(
      o, data, (events) => new EventStats.RatingDurationCalc(events, o.extra)
    );
    render(ReactHelpers.contain(function() {
      var calendars = Option.matchList(Stores.Calendars.list(o.teamId));
      let {chart, events} = getChart(o, {
        cal: (data) => <Components.RatingEventGrid
          calculation={
            new EventStats.RatingDateDurationCalc(data.dates, o.extra)
          }
          fetching={data.isBusy}
          error={data.hasError}
        />,
        pct: (data) => <Components.RatingPercentChart
          periods={getCalc(data)} />,
        abs: (data) => <Components.RatingHoursChart
          periods={getCalc(data)} />,
      });

      return getChartView(o, {chart, events});
    }));
  }
}
