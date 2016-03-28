/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.Header.tsx" />
/// <reference path="./Views.Footer.tsx" />

module Esper.Actions {
  // Set defaults for header and footer render
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header />;
    }
    if (footer !== null) {
      footer = footer || <Views.Footer />;
    }
    Layout.render(main, header, footer);
  }

  /////


  /* Validation, defaults for common params */

  export function cleanTeamId(teamId: string) {
    if (teamId && Teams.teamStore.has(teamId)) {
      return teamId;
    }

    var teams = Teams.all();
    Log.assert(teams.length > 0, "No teams loaded");

    // Return team where user is NOT exec (i.e. is an EA) or first team by
    // default
    var team = _.find(teams, (t) => t.team_executive !== Login.myUid())
      || teams[0];
    return team.teamid;
  }

  // Assumes calendar IDs never have commas in them. Use something else
  // if this proves to be untrue.
  export const CAL_ID_SEPARATOR = ",";

  export function cleanCalIds(teamId: string, calIdsStr: string) {
    var team = Teams.require(teamId);
    var calIds = _.filter(Util.some(calIdsStr, "").split(CAL_ID_SEPARATOR));
    if (_.intersection(team.team_timestats_calendars, calIds).length) {
      return calIds;
    }
    return team.team_timestats_calendars;
  }

  export function cleanInterval(intervalStr: string,
                                defaultInterval: Period.Interval = "week")
    : Period.Interval
  {
    switch(Util.some(intervalStr, "")[0]) {
      case "q":
        return "quarter";
      case "m":
        return "month";
      case "w":
        return "week";
      default:
        return defaultInterval;
    }
  }

  const PERIOD_SEPARATOR = ",";

  export function cleanPeriodRange(interval: Period.Interval,
                                   periodStr: string,
                                   defaultIndices?: [number, number])
    : Period.Range
  {
    var defaultIndex = Period.current(interval).index;
    var defaultIndices = defaultIndices || [defaultIndex, defaultIndex];
    var periods = _.filter(Util.some(periodStr, "").split(PERIOD_SEPARATOR));
    var first = cleanSinglePeriod(interval, periods[0], defaultIndices[0]);
    var second = cleanSinglePeriod(interval, periods[1], first.index);
    return {
      interval: interval,
      start: first.index,
      end: second.index
    };
  }

  export function cleanSinglePeriod(interval: Period.Interval,
                                    periodStr: string,
                                    defaultIndex?: number): Period.Single
  {
    var num = parseInt(periodStr);
    if (isNaN(num)) {
      num = Util.some(defaultIndex, Period.current(interval).index);
    }
    return {
      interval: interval,
      index: num
    }
  }


  /* Validation for common query JSON */

  // Filter events by title
  export interface FilterStrJSON {
    filterStr: string;
  }

  export function cleanFilterStrJSON(q: any = {}): FilterStrJSON {
    if (q && _.isString(q.filterStr)) {
      return q;
    }
    return { filterStr: "" };
  }


  // Filter events by some attribute in a list
  export interface ListSelectJSON {
    // Show all items
    all: boolean;

    // Show items with no label, domain, etc.
    none: boolean;

    // Show items with at least one of the items in this list
    some: string[];

    // Show items not matching any of the above?
    unmatched: boolean;
  }

  export function cleanListSelectJSON(q: any = {}): ListSelectJSON {
    q = q || {
      all: true,
      none: true,
      some: [],
      unmatched: false
    } as ListSelectJSON;

    if (! _.isBoolean(q.all)) { q.all = true; }
    if (! _.isBoolean(q.none)) { q.none = false; }
    if (!q.some || !_.every(q.some, (i) => _.isString(i))) { q.some = []; }
    if (! _.isBoolean(q.unmatched)) { q.unmatched = false; }

    return q;
  }


  /*
    Interface for filtering out a bunch of events
  */
  export interface EventFilterJSON {
    cals?: {
      teamId: string;
      calId: string
    }[];
    start?: number; // UTC time
    end?: number;   // UTC time
    labels?: string[];
    unlabeled?: boolean;
    allLabels?: boolean;
    filterStr?: string;
  }

  /*
    No guarantee that user input respects typing for EventFilterQuery pulled
    from querystring, so handling code should be robust.

    Also sets defaults for missing variables.
  */
  export function cleanEventFilterJSON(params?: EventFilterJSON) {
    params = params || {};

    var cals: Calendars.CalSelection[] = [];
    _.each(params.cals, (c) => {
      if (_.isString(c.teamId) && _.isString(c.calId)) {
        cals.push(c);
      }
    });
    if (! cals.length) {
      Option.cast(Calendars.defaultSelection()).match({
        none: () => null,
        some: (d) => cals.push(d)
      });
    }
    params.cals = cals;

    var duration = params.end - params.start;
    if (isNaN(duration) || duration <= 0) {
      params.start = moment().startOf('month').valueOf();
      params.end = moment().endOf('month').valueOf();
    }

    return params;
  }
}