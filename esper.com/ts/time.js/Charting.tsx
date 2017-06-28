/*
  Generalized approach to charting + helper functions for Highcharts
*/

/// <reference path="./Text.tsx" />

module Esper.Charting {

  /*
    On "simplified" pie or pct charts, we cut off data labels when the value
    gets too small. This is the threshold for cutoff.
  */
  const PIE_CHART_DATALABEL_CUTOFF = 0.05;

  /* Attributes to group by */

  // Group by (predicted) labels assigned to event
  export const GroupByLabel: Types.GroupBy = {
    name: Text.ChartLabels,
    icon: "fa-tags",
    keyFn: (event, props) => Params.applyListSelectJSON(
      Stores.Events.getLabelIds(event),
      props.extra.labels
    ),

    colorMapFn: (keys, props) => _.map(keys, (k) => {
      // TODO: Use a hash map instead of iterating for faster lookup
      let teamLabel = _.find(props.team.team_api.team_labels,
        (l) => l.normalized === k
      );
      if (teamLabel && teamLabel.color) return teamLabel.color;

      // No team label, pretend it's a hashtag?
      return Colors.getColorForHashtag(k);
    }),

    displayFn: (key, props) => {
      // TODO: Use a hash map instead of iterating for faster lookup
      let teamLabel = _.find(props.team.team_api.team_labels,
        (l) => l.normalized === key
      );
      return teamLabel ? teamLabel.original : key;
    },

    selectorKeysFn: (group, props) => {
      let groupKeys = _.keys(group.some);
      let teamKeys = _.map(props.team.team_api.team_labels,
        (l) => l.normalized
      );
      return _(groupKeys)
        .concat(teamKeys)
        .uniq()
        .sort()
        .value()
    },

    allText: Text.AllLabels,
    noneText: Text.Unlabeled,
    showAllText: Text.AllLabels,
    hideNoneText: Text.HideUnlabled,

    getListSelectJSONFn: (extra) => extra.labels,
    updateExtraFn: (x, props) => ({ labels: x }),

    selectorNoDataFn: () => <a href={Paths.Time.labelSetup().href}>
     { Text.NoLabelsMessage }
    </a>
  }


  // Group by meeting attendees
  export const GroupByGuest: Types.GroupBy = {
    name: Text.ChartGuests,
    icon: "fa-user",
    keyFn: (event, props) => Params.applyListSelectJSON(
      _.isEmpty(props.extra.domains.some) ?
        Stores.Events.getGuestEmails(event) :
        Stores.Events.getGuestEmails(event, props.extra.domains.some),
      props.extra.guests
    ),

    colorMapFn: (keys) => {
      let totalCounts: {[index: string]: number} = {};
      let indexCounts: {[index: string]: number} = {};

      _.each(keys, (key) => {
        let domain = key.split('@')[1] || key;
        totalCounts[domain] = (totalCounts[domain] || 0) + 1;
      });

      return _.map(keys, (key) => {
        let domain = key.split('@')[1] || key;
        let index = indexCounts[domain] = (indexCounts[domain] || 0) + 1;
        let base = Colors.getColorForDomain(domain);
        return step(base, index - 1, totalCounts[domain])
      });
    },

    allText: Text.AllGuests,
    noneText: Text.NoGuests,
    showAllText: Text.AllGuests,
    hideNoneText: Text.HideNoGuests,

    getListSelectJSONFn: (extra) => extra.guests,
    updateExtraFn: (x, props) => ({
      guests: x,

      // Guest count none, guest none, and domain none should be the same
      guestCounts: _.extend({}, props.extra.guestCounts, {
        none: x.none
      }) as Params.ListSelectJSON,
      domains: _.extend({}, props.extra.domains, {
        none: x.none
      }) as Params.ListSelectJSON
    })

  }

  // Group by e-mail domain names of meeting attendees
  export const GroupByDomain: Types.GroupBy = {
    name: Text.GuestDomains,
    icon: "fa-at",
    keyFn: (event, props) => Params.applyListSelectJSON(
      Stores.Events.getGuestDomains(event),
      props.extra.domains
    ),
    colorMapFn: (keys) => _.map(keys, Colors.getColorForDomain),

    allText: Text.AllGuests,
    noneText: Text.NoGuests,
    showAllText: Text.AllGuests,
    hideNoneText: Text.HideNoGuests,

    getListSelectJSONFn: (extra) => extra.domains,
    updateExtraFn: (x, props) => ({
      domains: x,

      // Guest count none, guest none, and domain none should be the same
      guests: _.extend({}, props.extra.guests, {
        none: x.none
      }) as Params.ListSelectJSON,
      guestCounts: _.extend({}, props.extra.guestCounts, {
        none: x.none
      }) as Params.ListSelectJSON
    })
  }


  // Group by calendar of event
  export const GroupByCalendar: Types.GroupBy = {
    name: Text.ChartCalendars,
    icon: "fa-calendar-o",
    keyFn: (event, props) => {
      let ids = event.calendarIds.filter(
        (id) => _.includes(props.extra.calIds, id));
      return ids.length ? Option.some(ids) : Option.none<string[]>();
    },
    colorMapFn: (keys) => _.map(keys, Colors.getColorForCal),
    displayFn: (key, prop) => {
      let cal = _.find(prop.calendars, (c) => c.id === key);
      return cal ? cal.title : key;
    },
    selectorKeysFn: (group, props) => props.team.team_timestats_calendars,

    allText: Text.AllCalendars,
    showAllText: Text.AllCalendars,

    getListSelectJSONFn: (extra) => ({
      all: false, some: extra.calIds, none: false
    }),
    updateExtraFn: (x, props) => ({ calIds: x.all ?
      props.team.team_timestats_calendars : x.some })
  }


  // Group by duration of event
  export const DURATION_BUCKETS = [{
    label: "< 30m",
    gte: 0,   // Greater than, seconds
    color: Colors.level0
  }, {
    label: "30m +",
    gte: 30 * 60,
    color: Colors.level1
  }, {
    label: "1h +",
    gte: 60 * 60,
    color: Colors.level2
  }, {
    label: "2h +",
    gte: 2 * 60 * 60,
    color: Colors.level3
  }, {
    label: "4h +",
    gte: 4 * 60 * 60,
    color: Colors.level4
  }, {
    label: "8h +",
    gte: 8 * 60 * 60,
    color: Colors.level5
  }];

  /*
    For duration calc, use nominal duration (ignore overlapping events
    because this can be un-intutive, also more annoying to abstract)
  */
  export function getDurationBucket(event: Stores.Events.TeamEvent): {
    label: string;
    gte: number;
    color: string;
  } {
    let duration = (event.end.getTime() - event.start.getTime()) / 1000;
    return _.findLast(DURATION_BUCKETS,
      (b) => duration >= b.gte
    );
  }

  export const GroupByDuration: Types.GroupBy = {
    name: Text.ChartDuration,
    icon: "fa-hourglass",
    keyFn: (event, props) => Params.applyListSelectJSON(
      [getDurationBucket(event).label],
      props.extra.durations
    ),

    colorMapFn: (keys) => {
      return _.map(keys, (k) => {
        let bucket = _.find(DURATION_BUCKETS, (b) => b.label === k);
        return bucket ? bucket.color : Colors.lightGray;
      });
    },

    displayFn: (key) => key,
    selectorKeysFn: () => _.map(DURATION_BUCKETS, (b) => b.label),
    chartKeysFn: () => _.map(DURATION_BUCKETS, (b) => b.label),

    allText: Text.AllDurations,
    showAllText: Text.AllDurations,

    getListSelectJSONFn: (extra) => extra.durations,
    updateExtraFn: (x, props) => ({ durations: x })
  }


  // Group by number of attendees at event
  export const GUEST_COUNT_BUCKETS = [{
    label: "2 " + Text.Guests,
    gte: 2,   // Greater than, guests
    color: Colors.level1
  }, {
    label: "3 - 4 " + Text.Guests,
    gte: 3,
    color: Colors.level2
  }, {
    label: "5 - 8 " + Text.Guests,
    gte: 5,
    color: Colors.level3
  }, {
    label: "9 - 18 " + Text.Guests,
    gte: 9,
    color: Colors.level4
  }, {
    label: "19+ " + Text.Guests,
    gte: 19,
    color: Colors.level5
  }];

  export function getGuestCountBucket(event: Types.TeamEvent,
                                      domains?: string[]): {
    label: string;
    gte: number;
    color: string;
  }
  {
    let emails = Stores.Events.getGuestEmails(event, domains);
    let count = emails.length + 1; // +1 for exec
    return _.findLast(GUEST_COUNT_BUCKETS, (b) => count >= b.gte);
  }

  export const GroupByGuestCount: Types.GroupBy = {
    name: Text.ChartGuestsCount,
    icon: "fa-users",
    keyFn: (event, props) => {
      let bucket = getGuestCountBucket(event);
      return Params.applyListSelectJSON(
        bucket ? [bucket.label] : [],
        props.extra.guestCounts
      )
    },

    colorMapFn: (keys) => {
      return _.map(keys, (k) => {
        let bucket = _.find(GUEST_COUNT_BUCKETS, (b) => b.label === k);
        return bucket ? bucket.color : Colors.lightGray;
      });
    },

    displayFn: (key) => key,
    selectorKeysFn: () => _.map(GUEST_COUNT_BUCKETS, (b) => b.label),
    chartKeysFn: () => _.map(GUEST_COUNT_BUCKETS, (b) => b.label),

    allText: Text.AllGuests,
    noneText: Text.NoGuests,
    showAllText: Text.AllGuests,
    hideNoneText: Text.HideNoGuests,

    getListSelectJSONFn: (extra) => extra.guestCounts,
    updateExtraFn: (x, props) => ({
      guestCounts: x,

      // Guest count none, guest none, and domain none should be the same
      guests: _.extend({}, props.extra.guests, {
        none: x.none
      }) as Params.ListSelectJSON,
      domains: _.extend({}, props.extra.domains, {
        none: x.none
      }) as Params.ListSelectJSON
    })
  }


  // Group by user-provided event rating
  function getStrRatings(event: Types.TeamEvent): string[] {
    return event.feedback && _.isNumber(event.feedback.stars) ?
           [event.feedback.stars.toString()] : [];
  }

  const MAX_RATING = 5;

  export const GroupByRating: Types.GroupBy = {
    name: Text.ChartRatings,
    icon: "fa-star",
    keyFn: (event, props) => Params.applyListSelectJSON(
      getStrRatings(event),
      props.extra.ratings
    ),

    colorMapFn: (keys) => _.map(keys,
      (k) => Colors.level(MAX_RATING - parseInt(k) + 1)
    ),

    displayFn: (key) => Text.stars(parseInt(key)),
    selectorKeysFn: () => _.times(MAX_RATING, (i) => (i + 1).toString()),
    chartKeysFn: () => _.times(MAX_RATING, (i) => (i + 1).toString()),

    allText: Text.AllRatings,
    noneText: Text.NoRating,
    showAllText: Text.AllRatings,
    hideNoneText: Text.HideNoRating,

    getListSelectJSONFn: (extra) => extra.ratings,
    updateExtraFn: (x, props) => ({ ratings: x })
  }


  /* Color helpers */ /////////////////////

  /*
    Colors in pie chart can be lightened versions of a base color. This
    value is the maximum percentage to lighten any given slice.
  */
  const MAX_COLOR_CHANGE = 0.7;

  // This is the maximum to lighten any slice relative to the previous one
  const MAX_COLOR_DELTA = 0.3;

  /*
    For chart coloring, we may want to lighten a particular color if there are
    multiple things nested under it.
  */
  function step(base: string, index: number, total: number): string {
    if (total > 1) {
      let colorStep = Math.min(
        MAX_COLOR_CHANGE / (total - 1),
        MAX_COLOR_DELTA);
      base = Colors.lighten(base, index * colorStep);
    }
    return base;
  }


  /* Compare props, used to minimize excessive chart updates */
  export function eqProps(p1: Types.ChartProps, p2: Types.ChartProps): boolean {
    // Whitelist props that get type-checked
    p1 = {
      eventsForRanges: p1.eventsForRanges,
      hasError: p1.hasError,
      isBusy: p1.isBusy,
      period: p1.period,
      team: p1.team,
      calendars: p1.calendars,
      groupBy: p1.groupBy,
      extra: p1.extra,
      simplified: p1.simplified
    };

    // Do shallow comparison of all keys with some exceptions
    for (let key in p1) {
      switch(key) {
        case "eventsForRanges":
          if (! Stores.Events.eqRanges(
            p1.eventsForRanges,
            p2.eventsForRanges, {
              deepCompare: true,
              ignoreLabelScores: true
            }
          )) {
            return false;
          }
          break;

        case "extra":
          if (! _.isEqual(p1.extra, p2.extra)) {
            return false;
          }
          break;

        case "period":
          if (! _.isEqual(p1.period, p2.period)) {
            return false;
          }
          break;

        default:
          if ((p1 as any)[key] !== (p2 as any)[key]) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  /*
    Like eqProps, but focuses only on props relevant to filtering criteria,
    as opposed to the actual events themselves. Used to determine whether
    to re-run a filtering calculation (as opposed to not re-run the
    calculation and only update a single event or datapoint within a view)
  */
  export function eqFilterProps(p1: Types.ChartProps, p2: Types.ChartProps) {
    return _.isEqual(p1.period, p2.period) &&
           _.isEqual(p1.extra, p2.extra) &&
           p1.calendars === p2.calendars &&
           p1.groupBy === p2.groupBy &&
           p1.isBusy === p2.isBusy &&
           p1.hasError === p2.hasError &&

           // TeamID only -> don't refresh if new labels
           p1.team.teamid === p2.team.teamid;
  }


  /* Filtering helpers */

  // Get the "standard" set of filters for our charts
  export function getFilterFns(props: Types.ChartProps): Types.FilterFn[] {
    let filters: Types.FilterFn[] = [];

    // Removed specifically ignored events
    filters.push(Stores.Events.isActive);

    // Filter by string
    if (props.extra.filterStr) {
      filters.push(function filterStr(e) {
        return Stores.Events.filterOne(e, props.extra.filterStr);
      });
    }

    // Filter by group functions
    if (props.groupBy !== Charting.GroupByLabel) {
      filters.push(function filterLabel(e) {
        return Charting.GroupByLabel.keyFn(e, props).isSome()
      });
    }

    if (props.groupBy !== Charting.GroupByDomain &&
        props.groupBy !== Charting.GroupByGuest) {
      filters.push(function filterDomain(e) {
        return Charting.GroupByDomain.keyFn(e, props).isSome()
      });
    }

    if (props.groupBy !== Charting.GroupByCalendar) {
      filters.push(function filterCalendar(e) {
        return Charting.GroupByCalendar.keyFn(e, props).isSome()
      });
    }

    if (props.groupBy !== Charting.GroupByDuration) {
      filters.push(function filterDuration(e) {
        return Charting.GroupByDuration.keyFn(e, props).isSome()
      });
    }

    if (props.groupBy !== Charting.GroupByGuestCount) {
      filters.push(function filterGuestCount(e) {
        return Charting.GroupByGuestCount.keyFn(e, props).isSome()
      });
    }

    if (props.groupBy !== Charting.GroupByRating) {
      filters.push(function filterRating(e) {
        return Charting.GroupByRating.keyFn(e, props).isSome()
      });
    }

    // Filter by weekHour
    if (props.extra.weekHours) {
      filters.push(function filterWeekHours(e) {
        return WeekHours.overlap(e, props.extra.weekHours)
      });
    }

    return filters;
  }


  /* Routing helpers */

  // PathFn -- passed function from routing
  type PathFn = (o: Paths.Time.chartPathOpts) => Paths.Path;

  export function pathFnForGroup(group: Types.GroupBy): PathFn {
    switch (group) {
      case Charting.GroupByCalendar:
        return Paths.Time.calendarsChart;
      case Charting.GroupByDomain:
        return Paths.Time.domainChart;
      case Charting.GroupByGuest:
        return Paths.Time.guestsChart;
      case Charting.GroupByDuration:
        return Paths.Time.durationsChart;
      case Charting.GroupByRating:
        return Paths.Time.ratingsChart;
      case Charting.GroupByGuestCount:
        return Paths.Time.guestsCountChart;
    }
    return Paths.Time.labelsChart; // Default
  }

  export function updateChart(
    props: Types.ChartProps,
    next: {
      groupBy?: Types.GroupBy;
      teamId?: string;
      period?: Types.Period;
      extra?: Types.ChartExtraOpt;
      navOpts?: Route.nav.Opts;
      reset?: boolean;
    })
  {
    let {path, opts} = updateChartPath(props, next);
    Route.nav.go(path, opts);
  }

  export function updateChartPath(
    props: Types.ChartProps,
    next: {
      groupBy?: Types.GroupBy;
      teamId?: string;
      period?: Types.Period;
      extra?: Types.ChartExtraOpt;
      navOpts?: Route.nav.Opts;
      reset?: boolean;
    }) : { path: Paths.Path; opts: Route.nav.Opts; }
  {
    let navOpts = next.navOpts || {};
    let groupBy = next.groupBy || props.groupBy;
    let teamId = next.teamId || props.team.teamid;
    let period = next.period || props.period;
    let extras: Types.ChartExtraOpt = {}

    /*
      Blank out filter params unless provided if:

      * Chart group changed
      * Team changed
      * Explicit reset
    */
    if (groupBy !== props.groupBy ||
        teamId !== props.team.teamid ||
        next.reset)
    {
      extras = next.extra || {};
    }

    // Else merge old extra with new params
    else {
      extras = _.extend({}, props.extra, next.extra);
    }

    // Remove params from querystring if identical to default
    let keys = _.keys(extras);
    if (keys.length) {
      let defaults: any = defaultExtras(teamId, groupBy);
      _.each(keys, (key) => {
        if (_.isEqual((extras as any)[key], defaults[key])) {
          delete (extras as any)[key];
        }
      });
    }

    // Convert weekHours object to serialized JSON
    navOpts.jsonQuery = extras;
    if (navOpts.jsonQuery.weekHours) {
      navOpts.jsonQuery.weekHours = Params.weekHoursJSON(
        navOpts.jsonQuery.weekHours
      );
    }

    let pathFn = pathFnForGroup(next.groupBy || groupBy);
    let path = pathFn({
      teamId,
      calIds: extras.calIds ?
        Params.pathForCalIds(extras.calIds) : Params.defaultCalIds,
      interval: period.interval[0],
      period: [period.start, period.end].join(Params.PERIOD_SEPARATOR),
    });

    return { path, opts: navOpts };
  }


  /*
    Clean up different query params that could be passed
  */
  export function cleanExtra(e: any): Types.ChartExtra {
    e = e || {};
    var typedQ: Types.ChartExtra = e;
    if (! _.includes([
      "percent", "absolute", "percent-series", "absolute-series"
    ], typedQ.type)) {
      typedQ.type = "percent";
    }

    typedQ.weekHours = Params.cleanWeekHours(typedQ.weekHours);
    typedQ.incUnscheduled = Params.cleanBoolean(typedQ.incUnscheduled);
    return typedQ;
  }

  // Group-specific cleaning -- call after cleanExtra
  export function cleanGroups(extra: Types.ChartExtra,
                              teamId: string,
                              groupBy?: Types.GroupBy): Types.ChartExtra {
    extra.calIds = Params.cleanCalIds(teamId, extra.calIds);
    extra.filterStr = Params.cleanString(extra.filterStr);
    extra.durations = Params.cleanListSelectJSON(extra.durations);

    /* Don't initially include none in selector if grouping by attr */
    extra.labels = Params.cleanListSelectJSON(extra.labels, {
      none: groupBy !== Charting.GroupByLabel
    });
    extra.ratings = Params.cleanListSelectJSON(extra.ratings, {
      none: groupBy !== Charting.GroupByRating
    });

    // Domain selector none, guest none, guest count none should match.
    extra.guestCounts = Params.cleanListSelectJSON(extra.guestCounts, {
      none: groupBy !== Charting.GroupByGuest &&
            groupBy !== Charting.GroupByDomain &&
            groupBy !== Charting.GroupByGuestCount
    });
    extra.guests = Params.cleanListSelectJSON(extra.guests);
    extra.domains = Params.cleanListSelectJSON(extra.domains);
    extra.guests.none = extra.domains.none = extra.guestCounts.none;
    return extra;
  }

  // Return default "select all" extras
  export function defaultExtras(teamId: string,
                                groupBy?: Types.GroupBy): Types.ChartExtra {
    let extra = cleanExtra({});
    extra = cleanGroups(extra, teamId, groupBy);
    return extra;
  }


  /* Highcharts Helpers */

  /*
    For use with charts where a series is a list of events, and each data
    point is a single event
  */
  export interface EventSeries {
    name: string,
    cursor: string,
    color: string,
    stack?: number,
    index?: number,
    data: HighchartsDataPoint[]
  };

  /*
    For use with charts where there is each data point in a series represents
    multiple events (e.g. events with a particular label)
  */
  export interface EventGroupSeries {
    name: string;
    color: string;
    cursor: string;
    index?: number;
    data: {
      name: string;
      count: number; /* Not part of Highcharts -- our own attribute for
                        passing data to tooltip on how many events make
                        up this single datapoint */
      x: number;
      y: number;
      events: HighchartsPointEvents;
    }[]
  }

  export interface SingleEventGroupSeries {
    cursor: string;
    data: {
      name: string;
      color: string;
      count: number; /* Not part of Highcharts -- our own attribute for
                        passing data to tooltip on how many events make
                        up this single datapoint */
      y: number;
      events: HighchartsPointEvents;
      dataLabels?: HighchartsDataLabels;
    }[]
  }

  export interface SeriesOpts {
    yFn?: (v: number) => number;           // Display version of values

    // Total values should add up to (used to add a remainder value to chart)
    totals?: number[];
  }


  /*
    Generate event series data from range series group. Uses RangesGroup but
    looks at series data and not individual range values. Returns actual
    series plus categories.
  */
  export function eventSeries(
    group: Types.RangesGroup,
    props: Types.ChartProps,
    opts: SeriesOpts = {}
  ) : { categories: string[], series: EventSeries[] } {
    let groupBy = props.groupBy;
    let keys = groupBy.chartKeysFn ?
      groupBy.chartKeysFn(group, props) :
      sortGroupKeys(group);
    let colors = groupBy.colorMapFn ?
      groupBy.colorMapFn(keys, props) : Colors.presets;

    // Generate actual series
    let series: EventSeries[] = []
    _.each(keys, (key, index) => {
      let value = group.some[key];
      series.push({
        name: Util.escapeBrackets((
          groupBy.displayFn ?
          (key: string) => groupBy.displayFn(key, props) :
          _.identity
        )(key)),
        cursor: "pointer",
        color: colors[index],
        data: value && !_.isEmpty(value.weights) ?
          _.map(value.weights, (w) => ({
            name: Text.eventTitleForChart(w.event),
            x: index,
            y: (opts.yFn || _.identity)(w.value),
            events: {
              click: () => onEventClick(w.event)
            }
          })) :

          /*
            We need to create an explicit zero-value data point to explicitly
            single to user that there is no data
          */
          [{
            name: Text.ChartEmptyEvent,
            x: index,
            y: opts.yFn ? opts.yFn(0) : 0,
            events: { click: () => false }
          }]
      });
    });

    // Handle none
    if (groupBy.noneText) {
      series.push({
        name: groupBy.noneText,
        cursor: "pointer",
        color: Colors.lightGray,
        data: _.map(group.none.weights, (w) => ({
          name: Text.eventTitleForChart(w.event),
          x: keys.length,
          y: (opts.yFn || _.identity)(w.value),
          events: {
            click: () => onEventClick(w.event)
          }
        }))
      });
    }

    return { categories: keys, series };
  }

  /*
    Generate event group series data for a single period -- there is only
    one series and each data point represents the events for a key
  */
  export function singleGroupSeries(
    group: Types.RangesGroup,
    props: Types.ChartProps,
    opts: SeriesOpts = {}
  ) : SingleEventGroupSeries {
    let groupBy = props.groupBy;
    let keys = groupBy.chartKeysFn ?
      groupBy.chartKeysFn(group, props) :
      sortGroupKeys(group);
    let colors = groupBy.colorMapFn ?
      groupBy.colorMapFn(keys, props) : Colors.presets;

    let series: SingleEventGroupSeries = {
      cursor: "pointer",
      data: _.map(keys, (key, kIndex) => {
        let value = group.some[key];
        let pct = (value && group.all) ?
          (value.totalValue / group.all.totalValue) : 0;
        return {
          name: Util.escapeBrackets((
            groupBy.displayFn ?
            (key: string) => groupBy.displayFn(key, props) :
            _.identity
          )(key)),
          color: colors[kIndex],
          count: value ? value.totalUnique : 0,
          y: (opts.yFn || _.identity)(value ? value.totalValue : 0),
          events: {
            click: () => onSeriesClick(value ? value.events : [])
          },
          dataLabels: props.simplified && pct < PIE_CHART_DATALABEL_CUTOFF ?
            { enabled: false } : null
        };
      })
    };

    // Handle none series
    if (groupBy.noneText) {
      series.data.push({
        name: groupBy.noneText,
        color: Colors.lightGray,
        count: group.none.totalUnique,
        y: (opts.yFn || _.identity)(group.none.totalValue),
        events: {
          click: () => onSeriesClick(group.none.events)
        }
      });
    }

    // Handle remainders
    if (opts.totals) {
      series.data.push({
        name: Text.ChartRemainder,
        color: Colors.lighterGray,
        count: 0,
        y: (opts.yFn || _.identity)(
          Math.max(_.sum(opts.totals) - group.all.totalValue, 0)
        ),
        events: { click: () => false }
      });
    }

    return series;
  }

  /*
    Generate event group series data from period groups -- each series is a
    key we're grouping events by and each data point are the events grouped
    by that key for a particular date range
  */
  export function eventGroupSeries(
    group: Types.RangesGroup,
    props: Types.ChartProps,
    opts: SeriesOpts = {}
  ) : EventGroupSeries[] {
    let groupBy = props.groupBy;
    let keys = groupBy.chartKeysFn ?
      groupBy.chartKeysFn(group, props) :
      sortGroupKeys(group);
    let colors = groupBy.colorMapFn ?
      groupBy.colorMapFn(keys, props) : Colors.presets;

    let periodNames = Text.fmtPeriodList(props.period, true);

    let series: EventGroupSeries[] = _.map(keys, (key, index) => {
      let groupSeries = group.some[key];
      let name = Util.escapeBrackets((
        groupBy.displayFn ?
        (key: string) => groupBy.displayFn(key, props) :
        _.identity
      )(key));

      return {
        name,
        cursor: "pointer",
        color: colors[index],

        data: groupSeries ? _.map(groupSeries.values, (v, vIndex) => ({
          name: `${name} (${periodNames[vIndex]})`,
          count: v.totalUnique,
          x: vIndex,
          y: (opts.yFn || _.identity)(v.totalValue),
          events: {
            click: () => onSeriesClick(v.events)
          }
        })) : []
      };
    });

    // Handle none series
    if (groupBy.noneText) {
      let name = groupBy.noneText;
      let s: EventGroupSeries = {
        name,
        cursor: "pointer",
        color: Colors.lightGray,
        data: _.map(group.none.values, (v, vIndex) => ({
          name: `${name} (${periodNames[vIndex]})`,
          count: v.totalUnique,
          x: vIndex,
          y: (opts.yFn || _.identity)(v.totalValue),
          events: {
            click: () => onSeriesClick(v.events)
          }
        }))
      };
    }

    // Handle remainders
    if (opts.totals) {
      let name = Text.ChartRemainder;
      let s: EventGroupSeries = {
        name,
        cursor: "pointer",
        color: Colors.lighterGray,
        data: _.map(group.all.values, (v, vIndex) => ({
          name: `${name} (${periodNames[vIndex]})`,
          count: 0,
          x: vIndex,
          y: (opts.yFn || _.identity)(
            opts.totals[vIndex] ?
            Math.max(opts.totals[vIndex] - v.totalValue, 0) : 0
          ),
          events: { click: () => false }
        }))
      };
      series.push(s);
    }

    return series;
  }

  // Sort group keys, descending
  export function sortGroupKeys(group: Types.RangesGroup): string[] {
    return _(group.some)
      .keys()
      .sortBy((k) => -group.some[k].totalValue)
      .value();
  }


  /* Helper functions for Highchart events */

  export function onEventClick(event: Stores.Events.TeamEvent) {
    // Confirm predicted labels when opening single event
    Actions.EventLabels.confirm([event]);

    Layout.renderModal(Containers.eventEditorModal([event]));
    return false;
  }

  export function onSeriesClick(events: Stores.Events.TeamEvent[]) {
    Layout.renderModal(Containers.eventListModal(events));
    return false;
  }

  export function eventPointFormatter(): string {
    var point: HighchartsPointObject = this;
    if (point.y === 0) return "";

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
    ret += Text.hours(point.y);
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

  export function stackPointFormatter(): string {
    /*
      Not sure what type is supposed to be here -- we just care about total
      for now
    */
    var stack: { total: number } = this;
    return Text.hoursShort(stack.total);
  }
}
