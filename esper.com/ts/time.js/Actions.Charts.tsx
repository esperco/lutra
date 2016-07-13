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
    typedQ.filterStr = Params.cleanString(typedQ.filterStr);
    typedQ.durations = Params.cleanListSelectJSON(typedQ.durations);
    typedQ.guestCounts = Params.cleanListSelectJSON(typedQ.guestCounts);
    typedQ.labels = Params.cleanListSelectJSON(typedQ.labels);
    typedQ.ratings = Params.cleanListSelectJSON(typedQ.ratings);

    // Domain selector none and guest count none should match.
    typedQ.domains = Params.cleanListSelectJSON(typedQ.domains);
    typedQ.domains.none = typedQ.guestCounts.none;

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
  function fetchAndClean<T>(o: BaseOpts<T>) {
    o.extra = cleanExtra(o.extra) as T & ExtraOpts;
    if (o.extra.type === "calendar") {
      o.period = toMonth(o.period);
    }
    fetchEvents(o);
  }


  /* Analytics */

  var analyticsId = "chart-analytics-id";

  function trackChart(o: BaseOpts<{}>, group: string) {

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


  /* Duration Charts */

  export function renderDurations(o: BaseOpts<{}>) {
    fetchAndClean(o);
    trackChart(o, "durations");
    render(ReactHelpers.contain(function() {
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.DateDurationBucketCalc(data.dates, o.extra);
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
          let calc = new EventStats.DurationBucketCalc(d.events, o.extra);
          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
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

  function getDurationChartView(o: BaseOpts<{}>,
                                chart: JSX.Element) {
    return <Views.Charts
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.durationsChart}
      chart={chart}
    />;
  }


  /* Calendars Charts */

  export function renderCalendars(o: BaseOpts<{}>) {
    fetchAndClean(o);
    trackChart(o, "calendars");
    render(ReactHelpers.contain(function() {
      var calendars = Option.matchList(Stores.Calendars.list(o.teamId));
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.CalendarDateDurationCalc(data.dates);
        let chart = <Components.CalendarEventGrid
          calendars={calendars}
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getCalendarsChartView(o, chart);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d) => {
          let calc = new EventStats.CalendarDurationCalc(d.events, o.extra);

          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.CalendarPercentChart
            data={calcData}
            calendars={calendars} /> :
          <Components.CalendarHoursChart
            data={calcData}
            calendars={calendars} />;

        return getCalendarsChartView(o, chart);
      }
    }));
  }

  function getCalendarsChartView(o: BaseOpts<{}>,
                                 chart: JSX.Element) {
    return <Views.Charts
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.calendarsChart}
      chart={chart}
    />;
  }


  /* Guest Charts */

  export function renderGuests(o: BaseOpts<EventStats.DomainOpts>) {
    fetchAndClean(o);
    trackChart(o, "guests");
    o.extra.domains = Params.cleanListSelectJSON(o.extra.domains);

    render(ReactHelpers.contain(function() {

      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.DomainDurationByDateCalc(data.dates, o.extra);
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
          let calc = new EventStats.GuestDurationCalc(d.events, {
            filterStr: o.extra.filterStr,
            domains: o.extra.domains,

            // Nest domains for pie chart
            nestByDomain: o.extra.type === "percent"
          });
          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
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

  function getGuestChartView(o: BaseOpts<EventStats.DomainOpts>,
                             chart: JSX.Element,
                             events: Stores.Events.TeamEvent[]) {
    var selectorCalc = new EventStats.DomainCountCalc(events, o.extra);
    var selector = <div className="esper-panel-section">
      <div className="esper-subheader">
        <i className="fa fa-fw fa-user" />{" "}
        { Text.GuestDomains }
      </div>
      <Components.DomainCalcSelector
        events={events}
        calculation={selectorCalc}
        selected={o.extra.domains}
        showNone={o.extra.type !== "absolute"}
        updateFn={(x) => updateDomains(x, o.extra)}
      />
    </div>;

    return <Views.Charts
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.guestsChart}
      chart={chart}
      selectors={selector}
    />
  }

  function updateDomains(p: {
    all: boolean;
    none: boolean;
    some: string[];
  }, extra: EventStats.DomainOpts) {
    Route.nav.query(_.extend({}, extra, { domains: p }));
  }


  /* Guest Count Charts */

  export function renderGuestsCount(o: BaseOpts<EventStats.DomainOpts>) {
    fetchAndClean(o);
    trackChart(o, "guest-counts");
    o.extra.domains = Params.cleanListSelectJSON(o.extra.domains);

    render(ReactHelpers.contain(function() {

      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.GuestCountDurationByDateCalc(
          data.dates, o.extra);
        let allEvents = _.flatten( _.map(data.dates, (d) => d.events ));
        let chart = <Components.GuestCountEventGrid
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getGuestCountChartView(o, chart, allEvents);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d, i) => {
          let calc = new EventStats.GuestCountDurationCalc(d.events, o.extra);
          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.GuestCountPercentChart data={calcData} /> :
          <Components.GuestCountHoursChart data={calcData} />;

        let allEvents = _.flatten( _.map(data, (d) => d.events) );
        return getGuestCountChartView(o, chart, allEvents);
      }
    }));
  }

  function getGuestCountChartView(o: BaseOpts<EventStats.DomainOpts>,
                                  chart: JSX.Element,
                                  events: Stores.Events.TeamEvent[]) {
    var selectorCalc = new EventStats.DomainCountCalc(events, o.extra);
    var selector = <div className="esper-panel-section">
      <div className="esper-subheader">
        <i className="fa fa-fw fa-user" />{" "}
        { Text.GuestDomains }
      </div>
      <Components.DomainCalcSelector
        events={events}
        calculation={selectorCalc}
        selected={o.extra.domains}
        showNone={true}
        updateFn={(x) => updateDomains(x, o.extra)}
      />
    </div>;

    return <Views.Charts
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.guestsCountChart}
      chart={chart}
      selectors={selector}
    />
  }


  /* Label Charts */

  export function renderLabels(o: BaseOpts<EventStats.LabelOpts>) {
    fetchAndClean(o);
    trackChart(o, "labels");
    o.extra.labels = Params.cleanListSelectJSON(o.extra.labels);

    render(ReactHelpers.contain(function() {
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.LabelDurationByDateCalc(data.dates, o.extra);
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
          let calc = new EventStats.LabelDurationCalc(d.events, o.extra);
          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
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

  function getLabelChartView(o: BaseOpts<EventStats.LabelOpts>,
                             chart: JSX.Element,
                             events: Stores.Events.TeamEvent[]) {
    var selectorCalc = new EventStats.LabelCountCalc(events, o.extra);
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

    return <Views.Charts
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
  }, extra: EventStats.LabelOpts) {
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


  /* Rating Charts */

  export function renderRatings(o: BaseOpts<EventStats.RatingOpts>) {
    fetchAndClean(o);
    trackChart(o, "ratings");
    o.extra.showNone = Params.cleanBoolean(o.extra.showNone);
    render(ReactHelpers.contain(function() {
      var calendars = Option.matchList(Stores.Calendars.list(o.teamId));
      if (o.extra.type === "calendar") {
        let data = getForMonth(o);
        let calc = new EventStats.RatingDateDurationCalc(data.dates, o.extra);
        let chart = <Components.RatingEventGrid
          calculation={calc}
          fetching={data.isBusy}
          error={data.hasError}
        />;
        return getRatingsChartView(o, chart);
      }

      else {
        let data = getEventData(o);
        let calcData = _.map(data, (d) => {
          let calc = new EventStats.RatingDurationCalc(d.events, o.extra);
          return {
            period: d.period,
            current: _.isEqual(d.period, o.period),
            fetching: d.isBusy,
            error: d.hasError,
            calculation: calc
          };
        });

        let chart = o.extra.type === "percent" ?
          <Components.RatingPercentChart data={calcData} /> :
          <Components.RatingHoursChart data={calcData} />;

        return getRatingsChartView(o, chart);
      }
    }));
  }

  function getRatingsChartView(o: BaseOpts<EventStats.RatingOpts>,
                               chart: JSX.Element) {
    var selector = <div className="esper-panel-section">
      <Components.SimpleToggle
        active={o.extra.showNone}
        title={Text.ShowNoRating}
        onChange={(x) => toggleHideNone(x, o.extra)}
      />
    </div>;

    return <Views.Charts
      teamId={o.teamId}
      calIds={o.calIds}
      period={o.period}
      extra={o.extra}
      pathFn={Paths.Time.ratingsChart}
      selectors={selector}
      chart={chart}
    />;
  }

  function toggleHideNone(active: boolean, extra: EventStats.RatingOpts) {
    Route.nav.query(_.extend({}, extra, { showNone: active }));
  }
}
