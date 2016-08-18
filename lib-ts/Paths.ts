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


  // Paths for /time
  export module Time {
    export const prefix = "/time";

    export function report({ teamId, interval, period } : {
      teamId?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "report", teamId, interval, period);
    }

    export interface chartPathOpts {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    }

    // Default chart path
    export function charts({
      teamId, calIds, interval, period
    } : chartPathOpts = {}) {
      return optPath(prefix, "charts",
                     teamId, calIds, interval, period);
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

    export function calendarLabeling({teamId, calIds, interval, period}: {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "calendar-labeling",
                     teamId, calIds, interval, period);
    }

    export function list({teamId, calIds, interval, period}: {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "list", teamId, calIds, interval, period);
    }

    export function listNew({teamId, calIds, interval, period}: {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "list-new", teamId, calIds, interval, period);
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

    export module Team {
      export const subprefix = "team";

      export function general({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "general", teamId);
      }

      export function labels({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "labels", teamId);
      }

      export function calendars({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "calendars", teamId);
      }

      export function notifications({teamId} : {teamId?: string} = {}) {
        return optPath(prefix, subprefix, "notifications", teamId);
      }
    }

    export module Group {
      export const subprefix = "group"

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
  }

  // Paths for /groups
  export module Groups {
    export const prefix = "/groups";

    export function home() {
      return optPath(prefix, "");
    }

    export function list({groupId} : {groupId?: string} = {}) {
      return optPath(prefix, "list");
    }
  }

  // Paths for /today
  export module Now {
    export const prefix = "/now";

    export function home() {
      return optPath(prefix, "");
    }

    export function event() {
      return optPath(prefix, "event");
    }

    export function date({date} : { date: Date|string }) {
      var dateStr = typeof date === "string" ?
       date : moment(date).format("YYYY-MM-DD");
      return optPath(prefix, "date", dateStr);
    }
  }
}
