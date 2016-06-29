/*
  Actions for charts page
*/

module Esper.Actions.Charts2 {
  // Base options needed to fetch and get events
  export interface BaseOpts<T extends ExtraOpts> {
    teamId: string;
    calIds: string[];
    period: Period.Single|Period.Custom;
    extra: T;
  }

  export interface DefaultBaseOpts extends BaseOpts<ExtraOpts> {};
  export interface ExtraOpts {
    type: Charting.ChartType;
    incrs: number[];
  }
  export interface LabelChartOpts extends ExtraOpts {
    labels: Params.ListSelectJSON;
  }
  export interface DomainChartOpts extends ExtraOpts {
    domains: Params.ListSelectJSON;
  }

  // Fetch events from server
  function fetchEvents<T extends ExtraOpts>(o: BaseOpts<T>) {
    var periods = Period.withIncrs(o.period, o.extra.incrs);
    _.each(periods, (p) => Stores.Events.fetchPredictionsForPeriod({
      teamId: o.teamId,
      period: p
    }));
  }

  // Fetch events + metadata for one or more periods
  function getEventData<T extends ExtraOpts>(o: BaseOpts<T>) {
    var periods = _.sortBy(
      Period.withIncrs(o.period, o.extra.incrs),
      Period.asNumber
    );
    return _.map(periods, (p) =>
      Stores.Events.getForPeriod({
        cals: _.map(o.calIds, (calId) => ({
          teamId: o.teamId,
          calId: calId
        })),
        period: p
      }).match({
        some: (d) => ({
          events: d.events,
          hasError: d.hasError,
          isBusy: d.isBusy,
          period: p
        }),

        // None => forgot to call fetch. Error.
        none: () => ({
          events: [] as Stores.Events.TeamEvent[],
          hasError: true,
          isBusy: false,
          period: p
        })
      })
    );
  }

  // Different get function for calendar grid view (sorted by day)
  function getForMonth<T extends ExtraOpts>(o: BaseOpts<T>) {
    return Stores.Events.getByDateForPeriod({
      cals: _.map(o.calIds, (calId) => ({
        teamId: o.teamId,
        calId: calId
      })),
      period: o.period
    }).match({
      some: (d) => d,

      // None => forgot to call fetch. Error.
      none: (): Stores.Events.EventDateData => ({
        isBusy: false,
        hasError: true,
        dates: []
      })
    })
  }

  /*
    Clean up different query params that could be passed
  */
  function cleanExtra(e: any): ExtraOpts {
    e = e || {};
    var typedQ: ExtraOpts = e;
    typedQ.incrs = Params.cleanRelativePeriodJSON(typedQ).incrs;
    if (! _.includes(["percent", "absolute", "calendar"], typedQ.type)) {
      typedQ.type = "percent";
    }
    return typedQ;
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
  function fetchAndClean<T extends ExtraOpts>(o: BaseOpts<T>) {
    o.extra = cleanExtra(o.extra) as T;
    if (o.extra.type === "calendar") {
      o.period = toMonth(o.period);
    }
    fetchEvents(o);
  }


  /* Duration Charts */

  export function renderDurations(o: DefaultBaseOpts) {
    fetchAndClean(o);
    render(ReactHelpers.contain(function() {
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.DateDurationBucketCalc(data.dates);
        calc.start();
        let chart = <Components.DurationEventGrid
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getDurationChartView(o, chart);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d) => {
          let calc = new EventStats.DurationBucketCalc(d.events);
          calc.start();

          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            events: d.events,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.DurationPercentChart data={calcData} /> :
          <Components.DurationHoursChart data={calcData} />;

        return getDurationChartView(o, chart);
      }
    }));
  }

  function getDurationChartView(o: DefaultBaseOpts,
                                chart: JSX.Element) {
    return <Views.Charts2
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.durationChart}
      chart={chart}
    />;
  }


  /* Guest Charts */

  export function renderGuests(o: BaseOpts<DomainChartOpts>) {
    fetchAndClean(o);
    o.extra.domains = Params.cleanListSelectJSON(o.extra.domains);

    render(ReactHelpers.contain(function() {

      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.DomainDurationByDateCalc(data.dates,
                                                           o.extra.domains);
        calc.start();
        let allEvents = _.flatten( _.map(data.dates, (d) => d.events ));
        let chart = <Components.DomainEventGrid
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getGuestChartView(o, chart, allEvents);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d, i) => {
          let calc = new EventStats.GuestDurationCalc(
            d.events,
            o.extra.domains,
            o.extra.type === "percent");  // Nest domains for pie chart
          calc.start();

          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            events: d.events,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.GuestPercentChart data={calcData} /> :
          <Components.GuestHoursChart data={calcData} />;

        let allEvents = _.flatten( _.map(data, (d) => d.events) );
        return getGuestChartView(o, chart, allEvents);
      }
    }));
  }

  function getGuestChartView(o: BaseOpts<DomainChartOpts>,
                             chart: JSX.Element,
                             events: Stores.Events.TeamEvent[]) {
    var selectorCalc = new EventStats.DomainCountCalc(events);
    selectorCalc.start();
    var selector = <div className="esper-panel-section">
      <div className="esper-subheader">
        <i className="fa fa-fw fa-user" />{" "}
        { Text.GuestDomains }
      </div>
      <Components.DomainCalcSelector
        events={events}
        calculation={selectorCalc}
        selected={o.extra.domains}
        showNone={o.extra.type === "percent"}
        updateFn={(x) => updateDomains(x, o.extra)}
      />
    </div>;

    return <Views.Charts2
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.guestChart}
      chart={chart}
      selectors={selector}
    />
  }

  function updateDomains(p: {
    all: boolean;
    none: boolean;
    some: string[];
  }, extra: DomainChartOpts) {
    Route.nav.query(_.extend({}, extra, { domains: p }));
  }


  /* Label Charts */

  export function renderLabels(o: BaseOpts<LabelChartOpts>) {
    fetchAndClean(o);
    o.extra.labels = Params.cleanListSelectJSON(o.extra.labels);

    render(ReactHelpers.contain(function() {
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.LabelDurationByDateCalc(data.dates,
                                                          o.extra.labels);
        calc.start();
        let allEvents = _.flatten( _.map(data.dates, (d) => d.events ));
        let chart = <Components.LabelEventGrid
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getLabelChartView(o, chart, allEvents);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d, i) => {
          let calc = new EventStats.LabelDurationCalc(d.events,
                                                      o.extra.labels);
          calc.start();

          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            events: d.events,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.LabelPercentChart data={calcData} /> :
          <Components.LabelHoursChart data={calcData} />;

        let allEvents = _.flatten( _.map(data, (d) => d.events) );
        return getLabelChartView(o, chart, allEvents);
      }
    }));
  }

  var autoLaunchConfirm = true; // This gets set to false after first launch.

  function getLabelChartView(o: BaseOpts<LabelChartOpts>,
                             chart: JSX.Element,
                             events: Stores.Events.TeamEvent[]) {
    var selectorCalc = new EventStats.LabelCountCalc(events);
    selectorCalc.start();
    var selector = <div className="esper-panel-section">
      <div className="esper-subheader">
        <i className="fa fa-fw fa-tags" />{" "}
        { Text.Labels }
      </div>
      <Components.LabelCalcSelector
        events={events}
        teams={[Stores.Teams.require(o.teamId)]}
        calculation={selectorCalc}
        showUnlabeled={o.extra.type === "percent"}

        selected={o.extra.labels.some}
        allSelected={o.extra.labels.all}
        unlabeledSelected={o.extra.labels.none}

        updateFn={(x) => updateLabels(x, o.extra)}
      />
    </div>;

    // Automatically open the confirmation modal the first time
    selectorCalc.onceChange(function(r) {
      if (autoLaunchConfirm && r.unconfirmedCount) {
        launchConfirmModal(r.unconfirmed);
      }
    });

    var confirmationMenu = {
      id: "confirm",
      tab: <Components.ConfirmBadge
        events={events}
        calculation={selectorCalc}
      />,
      onClick: () => {
        selectorCalc.getResults().match({
          none: () => null,
          some: (r) => launchConfirmModal(r.unconfirmed)
        });
        return false;
      }
    };

    return <Views.Charts2
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.labelsChart}
      chart={chart}
      selectors={selector}
      menus={[confirmationMenu]}
    />
  }

  function updateLabels({all, unlabeled, labels}: {
    all: boolean;
    unlabeled: boolean;
    labels: string[];
  }, extra: LabelChartOpts) {
    Route.nav.query(_.extend({}, extra, {
      labels: {
        all: all,
        none: unlabeled,
        some: labels
      }
    }));
  }

  function launchConfirmModal(events: Stores.Events.TeamEvent[]) {
    autoLaunchConfirm = false;
    Layout.renderModal(
      Containers.confirmListModal(events)
    );
  }
}
