/*
  Module for storing, querying, and manipulating time-stats data for
  auto-charts
*/

/// <reference path="./TimeStats.ts" />

module Esper.DailyStats {

  // Use API's cache for this -- values here rarely change, so we should be
  // fine
  export var StatStore = ApiC.postForDailyStats.store;

  type RequestPeriod = TimeStats.RequestPeriod;

  /*
    Asynchronously make call to server data for time stats data.
  */
  export function async(start: Date, end: Date,
    calendars: Calendars.CalSelection[])
  {
    if (! calendars.length) {
      Log.e("DailyStats.async called with no calendars selected");
      return;
    }
    return ApiC.postForDailyStats(
      requestToJSON({ windowStart: start, windowEnd: end }, calendars)
    );
  }

  function requestToJSON(x: RequestPeriod,
      calendars: Calendars.CalSelection[]): ApiT.DailyStatsRequest
  {
    return {
      window_start: XDate.toString(x.windowStart),
      window_end: XDate.toString(x.windowEnd),
      calendars: _.map(sortCals(calendars), (c) => {
        return {
          teamid: c.teamId,
          calid: c.calId
        };
      })
    };
  }

  // Sort team and calendars, so requests are normalized and produce
  // consistent cachek eys
  function sortCals(calendars: Calendars.CalSelection[]) {
    return _.sortBy(calendars, (c) => c.teamId + " " + c.calId);
  }

  export function get(start: Date, end: Date,
    calendars?: Calendars.CalSelection[])
  {
    if (! calendars.length) {
      Log.e("DailyStats.get called with no calendars selected");
      return;
    }
    var key = storeKey(start, end, calendars);
    return StatStore.get(key);
  }

  // Return string key used to access store based on vars
  function storeKey(start: Date, end: Date,
      calendars?: Calendars.CalSelection[])
  {
    return ApiC.postForDailyStats.strFunc([
      requestToJSON({ windowStart: start, windowEnd: end }, calendars)
    ]);
  }


  /* Guest Stats*/

  export interface GuestStats extends Partition.StatSet {
    time: number;   // seconds
    count: number;
  }

  export interface GuestDisplayResult {
    email: string;
    name?: string;
    time: number;
    count: number;
  }

  export interface GuestDomainDisplayResult {
    domain: string;
    time: number;
    count: number;
    guests: GuestDisplayResult[];
  }

  // Returns a list of top guests by count. Takes additional params to split
  // time equally among participants and filter by a list of domains
  export function topGuests(response: ApiT.DailyStatsResponse,
    split?: boolean, filterDomains?: string[])
  {
    // Map from email to display name (if any)
    var nameMap: {[index: string]: string} = {};

    var stats = response.guest_stats;
    var perms: Partition.Permutation<GuestStats>[] = _.map(stats, (s) => {
      var guestEmails = _.map(s.guests, (g) => {
        nameMap[g.email] = g.name;
        return g.email;
      });

      // Filter by domain => exclude e-mails
      if (filterDomains) {
        guestEmails = _.filter(guestEmails,
          (e) => _.includes(filterDomains, e.split('@')[1])
        )
      }

      var stats: GuestStats = {
        count: s.count,
        time: split ?
          (guestEmails.length ? s.time / guestEmails.length : 0)
          : s.time
      };

      return {
        ids: guestEmails,
        stats: stats
      };
    });

    var guestMap = Partition.partitionById(perms);
    var ret = _.map(guestMap, (guestStats, email): GuestDisplayResult => {
      return {
        email: email,
        name: nameMap[email],
        time: guestStats.time,
        count: guestStats.count
      };
    });

    return _.sortBy(ret, (x) => -x.count);
  }

  // Top domain names
  export function topGuestDomains(response: ApiT.DailyStatsResponse,
    filterDomains?: string[]): GuestDomainDisplayResult[]
  {
    // This is for a pie chart -- always split and apply filters
    var results = topGuests(response, true, filterDomains);
    var domainMap = _.groupBy(results, (r) => r.email.split('@')[1]);

    var ret = _.map(domainMap, (guests, domain) => {
      // Counts are not split, so can't just sum from topGuests result.
      var partitionsForDomain = _.filter(response.guest_stats, (s) =>
        !!_.find(s.guests, (g) => g.email.split('@')[1] === domain)
      )
      var count = _.sumBy(partitionsForDomain, (p) => p.count)

      return {
        domain: domain,
        time: _.sumBy(guests, (g) => g.time),
        count: count,
        guests: guests
      }
    });

    return _.sortBy(ret, (d) => -d.time);
  }

  /* Utils */
  export function sumScheduled(response: ApiT.DailyStatsResponse) {
    return _.sumBy(response.daily_stats, (s) => _.sum(s.scheduled));
  }

  export function sumWithGuests(response: ApiT.DailyStatsResponse) {
    return _.sumBy(response.daily_stats, (s) => _.sum(s.with_guests));
  }

  export function sumScheduledCount(response: ApiT.DailyStatsResponse) {
    return _.sumBy(response.daily_stats, (s) => s.scheduled.length);
  }

  export function sumWithGuestsCount(response: ApiT.DailyStatsResponse) {
    return _.sumBy(response.daily_stats, (s) => s.with_guests.length)
  }
}
