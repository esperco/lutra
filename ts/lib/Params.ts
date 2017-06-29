/*
  Namespace for helpers that clean up querystring params and the like
*/

/// <reference path="./LocalStore.ts" />
/// <reference path="./Stores.Calendars.ts" />
/// <reference path="./Stores.Teams.ts"/>

module Esper.Params {
  /* Validation, defaults for common params */

  // Remember last cleaned items to use as defaults
  var lastTeamId: string;
  var lastCalIds: string;

  // Remember last teamID, groupId, cals in memory too
  const lastTeamIdKey = "lastTeamId";
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

  // Assumes calendar IDs never have commas in them. Use something else
  // if this proves to be untrue.
  export const CAL_ID_SEPARATOR = ",";
  export const defaultCalIds = "default";

  // Cleans a list of calendar ids separated by CAL_ID_SEPARATOR
  export function cleanCalIds(teamId: string, calIdsStr: string|string[]) {
    var team = Stores.Teams.require(teamId);
    var calIds = _.isString(calIdsStr) ? (() => {
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
        return _.filter(Util.some(lastCalIds, "").split(CAL_ID_SEPARATOR));
      }

      return [];
    })() : calIdsStr;

    let ret = _.intersection(team.team_timestats_calendars, calIds);
    if (ret.length)
      return ret;
    else
      return team.team_timestats_calendars;
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
      case "c": // Backwards compat with former "custom" interval
        return "day";
      case "d":
        return "day";
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

  export const PERIOD_SEPARATOR = ",";

  export function cleanPeriod(interval: Types.Interval,
                              periodStr: string,
                              defaultIndices?: [number, number])
    : Types.Period
  {
    var defaultPeriod = Period.now(interval);
    var defaultIndices = defaultIndices ||
      [defaultPeriod.start, defaultPeriod.end];
    var periods = _.filter(Util.some(periodStr, "").split(PERIOD_SEPARATOR));
    var first = parseInt(periods[0]);
    if (isNaN(first)) {
      return Period.now(interval);
    }

    var second = parseInt(periods[1]);
    if (isNaN(second)) {
      second = first;
    }

    return {
      interval: interval,
      start: first,
      end: second
    };
  }

  // Spits out strings to use for period in URL - Deprecated
  export function periodStr(period: Types.Period) {
    return {
      interval: period.interval[0],
      period: [period.start, period.end].join(Params.PERIOD_SEPARATOR)
    };
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
