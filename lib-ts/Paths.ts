/*
  Routing paths, but listed as functions to make type checking easier
*/

module Esper.Paths {
  // Structured representation of path that distinguishes between base
  // and hashbang component
  export class Path {
    href: string;

    constructor(public base: string, public hash?: string) {
      base = base || "";
      if (base[0] !== "/") {
        base = "/" + base;
      }

      if (! _.isString(hash)) {
        this.href = base;
        return;
      }

      hash = hash || "";
      if (hash[0] !== "/") {
        hash = "/" + hash;
      }
      this.href = base + "#!" + hash;
    }
  }

  // Generate path based on optional args -- stop at first falsey
  // path param
  function optPath(base: string, main?: string, ...opt: string[]): Paths.Path {
    var i = 0;
    var ret: string[] = [];
    while (i < opt.length) {
      if (opt[i]) {
        ret.push("/" + opt[i]);
      } else {
        break;
      }
      i += 1;
    }

    return new Path(base, main ? ("/" + main + ret.join("")) : null);
  }

  // Paths for landing page (/ root)
  export module Landing {
    export function home() {
      return optPath("");
    }

    export function contact() {
      return optPath("/contact");
    }

    export function privacy() {
      return optPath("/privacy-policy");
    }

    export function terms() {
      return optPath("/terms-of-use");
    }
  }


  // Login page
  export module Login {
    export function home() {
      return optPath("login");
    }
  }


  // Paths for /time
  export module Time {
    export const prefix = "/time";

    export function home({} = {}) {
      return optPath(prefix, "charts");
    }

    // Doubles as nav for all the charts
    export function report({ teamId, interval, period } : {
      teamId?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "charts", teamId, interval, period);
    }

    // Alias
    export var charts = report;

    // Props for specific charts
    export interface chartPathOpts {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    }

    export function calendarsChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "calendars",
                     teamId, calIds, interval, period);
    }

    export function durationsChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "durations",
                     teamId, calIds, interval, period);
    }

    export function domainChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "domains",
                     teamId, calIds, interval, period);
    }

    export function guestsChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "guests",
                     teamId, calIds, interval, period);
    }

    export function guestsCountChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "guests-count",
                     teamId, calIds, interval, period);
    }

    export function labelsChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "labels",
                     teamId, calIds, interval, period);
    }

    export function ratingsChart({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts", "ratings",
                     teamId, calIds, interval, period);
    }

    export type listPathOpts = chartPathOpts;

    // Old path (redirect to one of listWeek, listMonth, or listAgenda)
    export function list({
      teamId, calIds, interval, period
    }: listPathOpts = {}) {
      return optPath(prefix, "list", teamId, calIds, interval, period);
    }

    export function listWeek({
      teamId, calIds, interval, period
    }: listPathOpts = {}) {
      return optPath(prefix, "list", "week", teamId, calIds, interval, period);
    }

    export function listMonth({
      teamId, calIds, interval, period
    }: listPathOpts = {}) {
      return optPath(prefix, "list", "month", teamId, calIds, interval, period);
    }

    export function listAgenda({
      teamId, calIds, interval, period
    }: listPathOpts = {}) {
      return optPath(prefix,
        "list", "agenda", teamId, calIds, interval, period);
    }

    export function labelSetup({} = {}) {
      return optPath(prefix, "label-setup");
    }

    export function calendarSetup({} = {}) {
      return optPath(prefix, "calendar-setup");
    }

    export function teamSetup({} = {}) {
      return optPath(prefix, "team-setup");
    }

    export function paymentInfo({teamId}: {
      teamId?: string;
    }) {
      return optPath(prefix, "payment-info", teamId);
    }
  }

  // Paths for /manage
  export module Manage {
    export const prefix = "/manage";

    export function home() {
      return optPath(prefix, "");
    }

    export function newTeam() {
      return optPath(prefix, "new-team");
    }

    export function personal() {
      return optPath(prefix, "personal");
    }

    export function newGroup() {
      return optPath(prefix, "new-group");
    }

    export function newCustomer() {
      return optPath(prefix, "new-customer");
    }

    export function sandbox() {
      return optPath(prefix, "sandbox");
    }

    export module Team {
      export const subprefix = "team";

      export function base({} = {}) {
        return optPath(prefix, subprefix);
      }

      export function general({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "general", teamId);
      }

      export function labels({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "labels", teamId);
      }

      export function calendars({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "calendars", teamId);
      }

      export function misc({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "misc", teamId);
      }

      export function notifications({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "notifications", teamId);
      }

      export function pay({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "pay", teamId);
      }

      export function exportCSV({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "export", teamId);
      }
    }

    export module Group {
      export const subprefix = "group";

      export function base({} = {}) {
        return optPath(prefix, subprefix);
      }

      export function general({groupId} : {groupId?: string} = {}) {
        return optPath(prefix, subprefix, "general", groupId);
      }

      export function labels({groupId} : {groupId?: string} = {}) {
        return optPath(prefix, subprefix, "labels", groupId);
      }

      export function notifications({groupId} : {groupId?: string} = {}) {
        return optPath(prefix, subprefix, "notifications", groupId);
      }
    }

    // For "enterprise" customers
    export module Customer {
      export const subprefix = "customer";

      export function general({cusId}: {cusId?: string} = {}) {
        return optPath(prefix, subprefix, "general", cusId);
      }

      export function accounts({cusId}: {cusId?: string} = {}) {
        return optPath(prefix, subprefix, "accounts", cusId);
      }

      export function pay({cusId} : {cusId?: string} = {}) {
        return optPath(prefix, subprefix, "pay", cusId);
      }
    }
  }

  // Paths for /groups
  export module Groups {
    export const prefix = "/groups";

    export function home() {
      return optPath(prefix, "");
    }
  }

  // Paths for /today
  export module Now {
    export const prefix = "/now";

    export function home() {
      return optPath(prefix, "");
    }

    export function event({eventId} : { eventId?: string }) {
      return optPath(prefix, "event", eventId);
    }

    export function date({date, teamId} : {
      date: Date|string;
      teamId?: string;
    }) {
      var dateStr = typeof date === "string" ?
       date : moment(date).format("YYYY-MM-DD");
      return optPath(prefix, "date", dateStr, teamId);
    }
  }
}
