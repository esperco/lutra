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

  // Remember last cleaned items to use as defaults
  var lastTeamId: string;
  var lastCalIds: string;

  // Clean team ID
  export function cleanTeamId(teamId: string) {
    if (teamId && Teams.teamStore.has(teamId)) {
      lastTeamId = teamId;
      return teamId;
    }

    else if (lastTeamId && Teams.teamStore.has(lastTeamId)) {
      return lastTeamId;
    }

    var teams = Teams.all();
    Log.assert(teams.length > 0, "No teams loaded");

    // Default to first team with calendars
    var team = _.find(teams, (t) => t.team_timestats_calendars.length > 0)
      || teams[0];
    return team.teamid;
  }

  // Assumes calendar IDs never have commas in them. Use something else
  // if this proves to be untrue.
  export const CAL_ID_SEPARATOR = ",";

  // Cleans a list of calendar ids separated by CAL_ID_SEPARATOR
  export function cleanCalIds(teamId: string, calIdsStr: string) {
    var team = Teams.require(teamId);
    lastCalIds = calIdsStr || lastCalIds;
    if (lastCalIds) {
      var calIds = _.filter(Util.some(lastCalIds, "").split(CAL_ID_SEPARATOR));
      return _.intersection(team.team_timestats_calendars, calIds);
    }
    return team.team_timestats_calendars;
  }

  // Like cleanCalIds, but returns team/cal objects
  export function cleanCalSelections(teamId: string, calIdsStr: string)
    : Calendars.CalSelection[]
  {
    return _.map(cleanCalIds(teamId, calIdsStr), (calId) => ({
      teamId: teamId,
      calId: calId
    }));
  }

  /*
    Given a (potentially empty) list of CalSections, return a teamId / calId
    path format. Currently only supports one team
  */
  export function pathForCals(cals: Calendars.CalSelection[]) {
    /*
      Default values don't need to match anything specific -- just need
      to not match an actual teamId or calendarId to trigger "empty" set
      behavior
    */
    var teamId = "default";
    var calIds = "empty";

    // If cals, then actually format something
    if (cals.length) {
      teamId = cals[0].teamId;
      calIds = _.map(cals, (c) => c.calId).join(CAL_ID_SEPARATOR);
    }
    return [teamId, calIds];
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
    Compares a list of strings against selection criteria. Returns Option.Some
    with the matching strings (if any, empty list is possible) or Option.None
    if not matching
  */
  export function applyListSelectJSON(items: string[], q: ListSelectJSON) {
    if (q.all) {
      return Option.some(items);
    }
    if (q.none && items.length === 0) {
      return Option.some(items);
    }

    var matches = _.filter(items, (i) => _.includes(q.some, i));
    if (matches.length) {
      return Option.some(matches);
    }
    return Option.none<string[]>();
  }
}
