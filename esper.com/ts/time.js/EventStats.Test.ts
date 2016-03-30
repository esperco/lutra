/// <reference path="../lib/Test.ts" />
/// <reference path="./EventStats.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.EventStats {
  describe("EventStats", function() {
    // Fixed vars for fetching and setting events
    const teamId = "teamId";
    const calId = "calId";
    const eventId1 = "eventId1";
    const eventId2 = "eventId2";
    const eventId3 = "eventId3";
    const eventId4 = "eventId4";
    const eventId5 = "eventId5";
    const eventId6 = "eventId6";

    /*
      A fairly complicated series of overlapping events for testing, around
      midnight between January 1 and 2
          Jan 1 | Jan 2
      e1:     x |
      e2:       | xx
      e3:       | xxxxx
      e4:       | x
      e5:       |  xxx
      e6:       |    xxx
      ------------------
              1 | 332321
    */
    var e1 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 1, 23)),
      end:   XDate.toString(new Date(2016, 0, 2)),
      calendar_id: calId,
      id: eventId1
    }));
    var e2 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2)),
      end:   XDate.toString(new Date(2016, 0, 2, 2)),
      calendar_id: calId,
      id: eventId2
    }));
    var e3 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2)),
      end:   XDate.toString(new Date(2016, 0, 2, 5)),
      calendar_id: calId,
      id: eventId3
    }));
    var e4 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2)),
      end:   XDate.toString(new Date(2016, 0, 2, 1)),
      calendar_id: calId,
      id: eventId4
    }));
    var e5 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2, 1)),
      end:   XDate.toString(new Date(2016, 0, 2, 4)),
      calendar_id: calId,
      id: eventId5
    }));
    var e6 = Events2.asTeamEvent(teamId, TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2, 3)),
      end:   XDate.toString(new Date(2016, 0, 2, 6)),
      calendar_id: calId,
      id: eventId5
    }));

    describe("getDurations", function() {
      function getVal() {
        var wrappers = _.map([e1, e2, e3, e4, e5, e6], (e, i) => ({
          event: e,
          index: i
        }))
        return getDurations(wrappers);
      }

      describe("by default", function() {
        it("should calculate duration in seconds for each event", function() {
          expect(_.map(getVal(), (e) => e.duration)).toEqual(
            _.map([1, 2, 5, 1, 3, 3], (s) => s * 60 * 60)
          );
        });

        it("should calculate overlap-adjusted duration for each event",
        function() {
          expect(_.map(getVal(), (e) => e.adjustedDuration)).toEqual(
            _.map([
              1,
              1/3 + 1/3,
              1/3 + 1/3 + 1/2 + 1/3 + 1/2,
              1/3,
              1/3 + 1/2 + 1/3,
              1/3 + 1/2 + 1
            ], (s) => Math.round(s * 60 * 60))
          );
        });

        it("should preserve wrapper data", function() {
          expect(_.map(getVal(), (e) => e.index)).toEqual([0, 1, 2, 3, 4, 5]);
        });
      });

      describe("with truncate", function() {
        function getVal() {
          var wrappers = _.map([e1, e2, e6], (e, i) => ({
            event: e,
            index: i
          }))
          return getDurations(wrappers, {
            truncateStart: new Date(2016, 0, 2),
            truncateEnd: new Date(2016, 0, 2, 5)
          });
        };

        it("should truncate durations before and after opts",
        function() {
          expect(_.map(getVal(), (e) => e.adjustedDuration)).toEqual(
            _.map([0, 2, 2], (s) => Math.round(s * 60 * 60))
          );
        });
      });
    });

  });
}
