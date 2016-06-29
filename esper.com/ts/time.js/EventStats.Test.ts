/// <reference path="../lib/Test.ts" />
/// <reference path="./EventStats.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.EventStats {
  describe("EventStats", function() {
    describe("aggregateDuration", function() {
      it("should count non-overlapping event duration", function() {
        var x = aggregateDuration([
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:00:00.000-08:00",
              end:   "2016-03-02T12:01:00.000-08:00"
            })),
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:03:00.000-08:00",
              end:   "2016-03-02T12:04:00.000-08:00"
            })),
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:06:00.000-08:00",
              end:   "2016-03-02T12:07:00.000-08:00"
            }))
        ]);
        expect(x).toEqual(3 * 60);
      });

      it("should not double-count overlapping event duration", function() {
        var x = aggregateDuration([
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:00:00.000-08:00",
              end:   "2016-03-02T12:05:00.000-08:00"
            })),
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:01:00.000-08:00",
              end:   "2016-03-02T12:02:00.000-08:00"
            })),
          Stores.Events.asTeamEvent("teamId",
            TestFixtures.makeGenericCalendarEvent({
              start: "2016-03-02T12:04:00.000-08:00",
              end:   "2016-03-02T12:07:00.000-08:00"
            }))
        ]);
        expect(x).toEqual(7 * 60);
      });
    });
  });
}
