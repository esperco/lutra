/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="./DailyStats.ts" />

module Esper.DailyStats {
  // Hours to Seconds
  function hts(h: number) {
    return h * 60 * 60;
  }

  // Sample DailyStats respose
  function getDailyStats(): ApiT.DailyStatsResponse {
    var GuestA: ApiT.Identity = {
      name: "Guest A",
      email: "a@example.com"
    };
    var GuestB: ApiT.Identity = {
      email: "b@example.com"
    };
    var GuestC: ApiT.Identity = {
      name: "Guest C",
      email: "c@internal.com"
    };


    return {
      has_domain_analysis: true,
      guest_stats: [{
        guests: [],
        count: 2,
        time: hts(3)
      }, {
        guests: [GuestA, GuestB],
        count: 3,
        time: hts(3)
      }, {
        guests: [GuestB, GuestC],
        count: 4,
        time: hts(5)
      }, {
        guests: [GuestC],
        count: 1,
        time: hts(7)
      }],

      daily_stats: [{
        // Empty day
        window_start: XDate.toString(new Date(2016, 0, 1)),
        scheduled: [],
        with_guests: [],
        internal: [],
        external: [],
        chunks: [hts(-24)],
        chunks_with_guests: []
      } as ApiT.DailyStats,

      { /*
          9AM - 10AM meeting with B+C
          10AM - 11AM meeting with A+B
          11AM - 12PM event with no guests
          1PM - 2PM meeting with A+B
          2PM - 4PM meeting with B+C
        */
        window_start: XDate.toString(new Date(2016, 0, 2)),
        scheduled: _.map([1, 1, 1, 1, 2], hts),
        with_guests: _.map([1, 1, 1, 2], hts),
        internal: [],
        external: _.map([1, 1, 1, 2], hts),
        chunks: _.map([-9, 3, -1, 3, -8], hts),
        chunks_with_guests: _.map([-9, 2, -2, 3, -8], hts)
      } as ApiT.DailyStats,
      { /*
          9AM - 10AM meeting with B+C
          1PM - 2PM meeting with A+B
          4PM - 6PM event with no guests
        */
        window_start: XDate.toString(new Date(2016, 0, 3)),
        scheduled: _.map([1, 1, 2], hts),
        with_guests: _.map([1, 1], hts),
        internal: [],
        external: _.map([1, 1], hts),
        chunks: _.map([-9, 1, -3, 1, -2, 2, -6], hts),
        chunks_with_guests: _.map([-9, 1, -3, 1, -10], hts)
      } as ApiT.DailyStats,
      {
        /*
          9AM - 10AM meeting with B+C
          1PM - 8PM meeting with C
        */
        window_start: XDate.toString(new Date(2016, 0, 4)),
        scheduled: _.map([1, 7], hts),
        with_guests: _.map([1, 7], hts),
        internal: [hts(7)],
        external: [hts(1)],
        chunks: _.map([-9, 1, -3, 7, -4], hts),
        chunks_with_guests: _.map([-9, 1, -3, 7, -4], hts)
      } as ApiT.DailyStats]
    }
  }

  describe("DailyStats", function() {
    describe("topGuests", function() {
      it("should list top guests by count and not split hours", function() {
        expect(topGuests(getDailyStats())).toEqual([{
          name: undefined,
          email: "b@example.com",
          time: hts(8),
          count: 7
        } as GuestDisplayResult, {
          name: "Guest C",
          email: "c@internal.com",
          time: hts(12),
          count: 5
        } as GuestDisplayResult, {
          name: "Guest A",
          email: "a@example.com",
          time: hts(3),
          count: 3
        } as GuestDisplayResult])
      });

      it("should allow filtering by domain", function() {
        expect(topGuests(getDailyStats(), false, ["example.com"])).toEqual([{
          name: undefined,
          email: "b@example.com",
          time: hts(8),
          count: 7
        } as GuestDisplayResult, {
          name: "Guest A",
          email: "a@example.com",
          time: hts(3),
          count: 3
        } as GuestDisplayResult])
      });
    });

    describe("topGuestDomains", function() {
      it("should list top domains by split hours", function() {
        expect(topGuestDomains(getDailyStats())).toEqual([{
          domain: "internal.com",
          time: hts(9.5),
          count: 5,
          guests: [{
            name: "Guest C",
            email: "c@internal.com",
            time: hts(9.5),
            count: 5
          }]
        } as GuestDomainDisplayResult, {
          domain: "example.com",
          time: hts(5.5),
          count: 7,
          guests: [{
            name: undefined,
            email: "b@example.com",
            time: hts(4),
            count: 7
          }, {
            name: "Guest A",
            email: "a@example.com",
            time: hts(1.5),
            count: 3
          }]
        } as GuestDomainDisplayResult]);
      });

      it("should adjust splits after filtering by domain", function() {
        expect(topGuestDomains(getDailyStats(), ["example.com"])).toEqual([{
          domain: "example.com",
          time: hts(8),
          count: 7,
          guests: [{
            name: undefined,
            email: "b@example.com",
            time: hts(6.5),
            count: 7
          }, {
            name: "Guest A",
            email: "a@example.com",
            time: hts(1.5),
            count: 3
          }]
        } as GuestDomainDisplayResult]);
      });
    });
  });
}
