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

    export function charts({chartId, teamId, calIds, interval, period} : {
      chartId?: string;
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "charts",
                     chartId, teamId, calIds, interval, period);
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

    export function calendarManage({teamId}: {teamId?: string} = {}) {
      return optPath(prefix, "calendar-manage", teamId);
    }

    export function event({}: {} = {}) {
      return optPath(prefix, "event");
    }

    export function list({teamId, calIds, interval, period}: {
      teamId?: string;
      calIds?: string;
      interval?: string;
      period?: string;
    } = {}) {
      return optPath(prefix, "list", teamId, calIds, interval, period);
    }

    export function labelSetup({teamId}: {teamId?: string} = {}) {
      return optPath(prefix, "label-setup", teamId);
    }

    export function calendarSetup({teamId}: {teamId?: string} = {}) {
      return optPath(prefix, "calendar-setup");
    }

    export function teamSetup({}: {} = {}) {
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

    export function general({teamId} : {teamId?: string} = {}) {
      return optPath(prefix, "general", teamId);
    }

    export function labels({teamId} : {teamId?: string} = {}) {
      return optPath(prefix, "labels", teamId);
    }

    export function calendars({teamId} : {teamId?: string} = {}) {
      return optPath(prefix, "calendars", teamId);
    }

    export function notifications({teamId} : {teamId?: string} = {}) {
      return optPath(prefix, "notifications", teamId);
    }
  }
}
