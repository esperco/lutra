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
  export type ExtraOptsType = "percent"|"absolute";
  export interface ExtraOpts {
    type: ExtraOptsType; // Pie vs. bar
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
    return Option.flatten(
      _.map(periods, (p) =>
        Stores.Events.getForPeriod({
          cals: _.map(o.calIds, (calId) => ({
            teamId: o.teamId,
            calId: calId
          })),
          period: p
        }).flatMap((d) => Option.some({
          events: d.events,
          hasError: d.hasError,
          isBusy: d.isBusy,
          period: p
        }))
      )
    );
  }

  /*
    Clean up different query params that could be passed
  */
  function cleanExtra(e: any): ExtraOpts {
    e = e || {};
    var typedQ: ExtraOpts = e;
    typedQ.incrs = Params.cleanRelativePeriodJSON(typedQ).incrs;
    if (! _.includes(["percent", "absolute"], typedQ.type)) {
      typedQ.type = "percent";
    }
    return typedQ;
  }


  /* Duration Charts */

  export function renderDurations(o: DefaultBaseOpts) {
    o.extra = cleanExtra(o.extra);
    fetchEvents(o);

    render(ReactHelpers.contain(function() {
      var data = getEventData(o);
      var calcData = _.map(data, (d) => {
        let calc = new EventStats.DurationBucketCalc();
        calc.start(d.events);

        return {
          period: d.period,
          current: _.isEqual(d.period, o.period),
          fetching: d.isBusy,
          error: d.hasError,
          events: d.events,
          calculation: calc
        };
      });

      var chart = o.extra.type === "percent" ?
        <Components.DurationPercentChart data={calcData} /> :
        <Components.DurationHoursChart data={calcData} />;

      return <Views.Charts2
        teamId={o.teamId}
        calIds={o.calIds}
        period={o.period}
        extra={o.extra}
        pathFn={Paths.Time.durationChart}
        chart={chart}
      />
    }));
  }


  /* Guest Charts */

  export function renderGuests(o: BaseOpts<DomainChartOpts>) {
    o.extra = cleanExtra(o.extra) as DomainChartOpts;
    o.extra.domains = Params.cleanListSelectJSON(o.extra.domains);
    fetchEvents(o);

    render(ReactHelpers.contain(function() {
      var data = getEventData(o);
      var calcData = _.map(data, (d, i) => {
        let calc = new EventStats.GuestDurationCalc(
          o.extra.domains,
          o.extra.type === "percent");  // Nest domains for pie chart
        calc.start(d.events);

        return {
          period: d.period,
          current: _.isEqual(d.period, o.period),
          fetching: d.isBusy,
          error: d.hasError,
          events: d.events,
          calculation: calc
        };
      });

      var chart = o.extra.type === "percent" ?
        <Components.GuestPercentChart data={calcData} /> :
        <Components.GuestHoursChart data={calcData} />;

      var selectorCalc = new EventStats.DomainCountCalc();
      var allEvents = _.flatten( _.map(data, (d) => d.events) );
      selectorCalc.start(allEvents);
      var selector = <div className="esper-panel-section">
        <div className="esper-subheader">
          <i className="fa fa-fw fa-user" />{" "}
          { Text.GuestDomains }
        </div>
        <Components.DomainCalcSelector
          events={allEvents}
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
    }));
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
    o.extra = cleanExtra(o.extra) as LabelChartOpts;
    o.extra.labels = Params.cleanListSelectJSON(o.extra.labels);
    fetchEvents(o);

    render(ReactHelpers.contain(function() {
      var data = getEventData(o);
      var calcData = _.map(data, (d, i) => {
        let calc = new EventStats.LabelDurationCalc(o.extra.labels);
        calc.start(d.events);

        return {
          period: d.period,
          current: _.isEqual(d.period, o.period),
          fetching: d.isBusy,
          error: d.hasError,
          events: d.events,
          calculation: calc
        };
      });

      var chart = o.extra.type === "percent" ?
        <Components.LabelPercentChart data={calcData} /> :
        <Components.LabelHoursChart data={calcData} />;

      var selectorCalc = new EventStats.LabelCountCalc();
      var allEvents = _.flatten( _.map(data, (d) => d.events) );
      selectorCalc.start(allEvents);
      var selector = <div className="esper-panel-section">
        <div className="esper-subheader">
          <i className="fa fa-fw fa-tags" />{" "}
          { Text.Labels }
        </div>
        <Components.LabelCalcSelector
          events={allEvents}
          teams={[Stores.Teams.require(o.teamId)]}
          calculation={selectorCalc}
          showUnlabeled={o.extra.type === "percent"}

          selected={o.extra.labels.some}
          allSelected={o.extra.labels.all}
          unlabeledSelected={o.extra.labels.none}

          updateFn={(x) => updateLabels(x, o.extra)}
        />
      </div>;

      var confirmationMenu = {
        id: "confirm",
        tab: <Components.ConfirmBadge
          events={allEvents}
          calculation={selectorCalc}
        />,
        onClick: () => {
          selectorCalc.getResults().match({
            none: () => null,
            some: (r) => Layout.renderModal(
              Containers.confirmListModal(r.unconfirmed)
            )
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
    }));

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

    var autoLaunchConfirm = true;
    function launchConfirmModal(events: Stores.Events.TeamEvent[]) {
      autoLaunchConfirm = false;
      Layout.renderModal(
        Containers.confirmListModal(events)
      );
    }
  }
}
