/*
  Namespace for helpers that clean up querystring params and the like
*/

/// <reference path="./LocalStore.ts" />
/// <reference path="./Stores.Calendars.ts" />
/// <reference path="./Stores.Groups.ts"/>
/// <reference path="./Stores.Teams.ts"/>

module Esper.Params {
  /* Validation, defaults for common params */

  // Remember last cleaned items to use as defaults
  var lastTeamId: string;
  var lastGroupId: string;
  var lastCalIds: string;

  // Remember last teamID, groupId, cals in memory too
  const lastTeamIdKey = "lastTeamId";
  const lastGroupIdKey = "lastGroupId";
  const lastCalIdsKey = "lastCalIds";

  // Clean team ID
  export function cleanTeamId(teamId: string) {
    if (teamId && Stores.Teams.get(teamId).isSome()) {
      lastTeamId = teamId;
      LocalStore.set(lastTeamIdKey, teamId);
      return teamId;
    }

    else if (lastTeamId && Stores.Teams.get(lastTeamId).isSome()) {
      return lastTeamId;
    }

    else {
      var storedTeamId = LocalStore.get(lastTeamIdKey);
      if (typeof storedTeamId === "string" &&
          Stores.Teams.get(storedTeamId).isSome()) {
        return storedTeamId;
      }
    }

    var teams = Stores.Teams.all();
    Log.assert(teams.length > 0, "No teams loaded");

    // Default to first team with calendars
    var team = _.find(teams, (t) => t.team_timestats_calendars.length > 0)
      || teams[0];
    return team.teamid;
  }

  // Clean group ID
  export function cleanGroupId(groupId: string) {
    if (groupId && Stores.Groups.get(groupId).isSome()) {
      lastGroupId = groupId;
      LocalStore.set(lastGroupIdKey, groupId);
      return groupId;
    }

    else if (lastGroupId && Stores.Groups.get(lastGroupId).isSome()) {
      return lastGroupId;
    }

    else {
      var storedGroupId = LocalStore.get(lastGroupIdKey);
      if (typeof storedGroupId === "string" &&
          Stores.Groups.get(storedGroupId).isSome()) {
        return storedGroupId;
      }
    }

    var groups = Stores.Groups.all();
    Log.assert(groups.length > 0, "No groups loaded");

    // Default to first group
    var group = groups[0];
    return group.groupid;
  }

  // Assumes calendar IDs never have commas in them. Use something else
  // if this proves to be untrue.
  export const CAL_ID_SEPARATOR = ",";
  export const MAX_DEFAULT_CALS = 10;
  export const defaultCalIds = "default";

  // Cleans a list of calendar ids separated by CAL_ID_SEPARATOR
  export function cleanCalIds(teamId: string, calIdsStr: string) {
    var team = Stores.Teams.require(teamId);
    /*
      Allow emptyCalIds only if explicitly specified (don't return empty
      if inferred by lastCalIds or LocalStore
    */
    if (calIdsStr === emptyCalIds) {
      LocalStore.set(lastCalIdsKey, defaultCalIds);
      lastCalIds = defaultCalIds;
      return [];
    }

    if (calIdsStr) {
      LocalStore.set(lastCalIdsKey, calIdsStr);
    }

    lastCalIds = calIdsStr || lastCalIds || LocalStore.get(lastCalIdsKey);
    if (typeof lastCalIds === "string" &&
        lastCalIds !== defaultCalIds) {
      let calIds = _.filter(Util.some(lastCalIds, "").split(CAL_ID_SEPARATOR));
      let ret = _.intersection(team.team_timestats_calendars, calIds);
      if (ret.length) return ret;
    }
    return team.team_timestats_calendars.slice(0, MAX_DEFAULT_CALS);
  }

  // Like cleanCalIds, but returns team/cal objects
  export function cleanCalSelections(teamId: string, calIdsStr: string)
    : Stores.Calendars.CalSelection[]
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
  export function pathForCals(cals: Stores.Calendars.CalSelection[]) {
    /*
      Default values don't need to match anything specific -- just need
      to not match an actual teamId or calendarId to trigger "empty" set
      behavior
    */
    var teamId = defaultTeamId;
    var calIds = emptyCalIds;

    // If cals, then actually format something
    if (cals.length) {
      teamId = cals[0].teamId;
      calIds = pathForCalIds(_.map(cals, (c) => c.calId));
    }
    return [teamId, calIds];
  }

  export function pathForCalIds(calIds: string[]) {
    return calIds.length ? calIds.join(CAL_ID_SEPARATOR) : emptyCalIds;
  }

  export const defaultTeamId = "default";
  export const emptyCalIds = "empty";

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

  export function cleanIntervalOrCustom(
      intervalStr: string,
      defaultInterval: Period.IntervalOrCustom = "week")
    : Period.IntervalOrCustom
  {
    if (intervalStr && intervalStr[0] === "c") {
      return "custom";
    }
    if (Period.isCustomInterval(defaultInterval)) {
      return "custom";
    } else {
      return cleanInterval(intervalStr, defaultInterval);
    }
  }

  export const PERIOD_SEPARATOR = ",";

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

  export function cleanCustomPeriod(periodStr: string): Period.Custom {
    var split = periodStr.split(PERIOD_SEPARATOR);
    var start = parseInt(split[0]);
    var end = parseInt(split[1]);
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return {
        interval: "custom",
        start: start,
        end: end
      };
    }
    return Period.current('custom');
  }

  export function cleanSingleOrCustomPeriod(
    interval: Period.Interval, periodStr: string): Period.Single;
  export function cleanSingleOrCustomPeriod(
    interval: Period.CustomInterval, periodStr: string): Period.Custom;
  export function cleanSingleOrCustomPeriod(
    interval: Period.IntervalOrCustom,
    periodStr: string
  ): Period.Single|Period.Custom;
  export function cleanSingleOrCustomPeriod(
    interval: Period.IntervalOrCustom,
    periodStr: string
  ): Period.Single|Period.Custom {
    if (Period.isCustomInterval(interval)) {
      return cleanCustomPeriod(periodStr);
    } else {
      return cleanSinglePeriod(interval, periodStr);
    }
  }


  /* Validation for common query JSON */

  // Filter events by title
  export interface FilterStrJSON {
    filterStr: string;
  }

  export function cleanFilterStrJSON(q: any): FilterStrJSON {
    q = q || {};
    var typedQ = q as FilterStrJSON;
    if (! _.isString(typedQ.filterStr)) {
      typedQ.filterStr = "";
    }
    return typedQ;
  }


  // Filter events by some attribute in a list
  export type ListSelectJSON = Types.ListSelectJSON;

  export function cleanListSelectJSON(q: any = {}, defaults: {
    all?: boolean;
    none?: boolean;
    some?: string[];
  } = {}): ListSelectJSON {
    q = q || {
      all: Util.some(defaults.all, true),
      none: Util.some(defaults.none, true),
      some: Util.some(defaults.some, [])
    } as ListSelectJSON;

    if (! _.isBoolean(q.all)) {
      q.all = Util.some(defaults.all,
        !_.isBoolean(q.none) && !_.isArray(q.some)
      );
    }
    if (! _.isBoolean(q.none)) { q.none = Util.some(defaults.none, true); }
    if (!_.isArray(q.some) || !_.every(q.some, (i) => _.isString(i))) {
      q.some = Util.some(defaults.some, []);
    }

    return q;
  }

  /*
    Compares a list of strings against selection criteria. Returns Option.Some
    with the matching strings (if any, empty list is possible) or Option.None
    if not matching
  */
  export function applyListSelectJSON(items: string[], q: ListSelectJSON) {
    if (q.all && items.length) {
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


  // Pick additional relative time periods to compare to
  export interface RelativePeriodJSON {
    incrs: number[];
  }

  export function cleanRelativePeriodJSON(q: any = {}): RelativePeriodJSON {
    var typedQ: RelativePeriodJSON = q || {
      incrs: [0]
    };
    if (typedQ.incrs) {
      typedQ.incrs = _(typedQ.incrs)
        .filter(_.isNumber)
        .map((i) => Math.round(i))
        .uniq()
        .sort()
        .value();
    } else {
      typedQ.incrs = [0];
    }
    return typedQ;
  }

  export function cleanString(x: any) {
    return _.isString(x) ? x : "";
  }

  export function cleanBoolean(x: boolean) {
    return !!x;
  }

  export interface FilterListJSON extends FilterStrJSON {
    labels: ListSelectJSON;
    unconfirmed: boolean;
  }
}
