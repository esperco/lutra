/*
  Client-side time stat calculations
*/

/// <reference path="./EventStats.ts" />

module Esper.EventStats {
  describe("EventStats", function() {
    const teamId = "teamId";
    const calId = "calId";

    //////

    describe("durationWrappers", function() {

      // Fixed vars for fetching and setting events
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
      var e1 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 1, 23)),
          end:   XDate.toString(new Date(2016, 0, 2)),
          calendar_id: calId,
          id: eventId1
        }));
      var e2 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2)),
          end:   XDate.toString(new Date(2016, 0, 2, 2)),
          calendar_id: calId,
          id: eventId2
        }));
      var e3 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2)),
          end:   XDate.toString(new Date(2016, 0, 2, 5)),
          calendar_id: calId,
          id: eventId3
        }));
      var e4 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2)),
          end:   XDate.toString(new Date(2016, 0, 2, 1)),
          calendar_id: calId,
          id: eventId4
        }));
      var e5 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 1)),
          end:   XDate.toString(new Date(2016, 0, 2, 4)),
          calendar_id: calId,
          id: eventId5
        }));
      var e6 = Stores.Events.asTeamEvent(teamId,
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 3)),
          end:   XDate.toString(new Date(2016, 0, 2, 6)),
          calendar_id: calId,
          id: eventId5
        }));

      function getVal() {
        return durationWrappers([e1, e2, e3, e4, e5, e6]);
      }

      describe("by default", function() {
        it("should calculate overlap-adjusted duration for each event",
        function() {
          expect(_.map(getVal(), (e) => e.duration)).toEqual(
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
      });

      describe("with truncate", function() {
        function getVal() {
          return durationWrappers([e1, e2, e6], {
            truncateStart: new Date(2016, 0, 2),
            truncateEnd: new Date(2016, 0, 2, 5)
          });
        };

        it("should truncate durations before and after opts",
        function() {
          expect(_.map(getVal(), (e) => e.duration)).toEqual(
            _.map([0, 2, 2], (s) => Math.round(s * 60 * 60))
          );
        });
      });

      describe("with weekHours", function() {
        let nineToFive = {
          start: { hour: 9, minute: 0 },
          end: { hour: 17, minute: 0}
        };
        let weekHours = {
          mon: Option.some(nineToFive),
          tue: Option.some(nineToFive),
          wed: Option.some(nineToFive),
          thu: Option.some(nineToFive),
          fri: Option.some(nineToFive),
          sat: Option.none<Types.DayHours>(),
          sun: Option.none<Types.DayHours>()
        };

        it("should only count durations overlapping specified hours",
        function() {
          let e1 = Stores.Events.asTeamEvent(teamId,
            TestFixtures.makeGenericCalendarEvent({
              start: XDate.toString(new Date(2016, 0, 1, 5)),  // Friday
              end:   XDate.toString(new Date(2016, 0, 4, 18)), // Monday
            }));
          let e2 = Stores.Events.asTeamEvent(teamId,
            TestFixtures.makeGenericCalendarEvent({
              start: XDate.toString(new Date(2016, 0, 4, 9)),  // Friday
              end:   XDate.toString(new Date(2016, 0, 4, 18)), // Monday
            }));
          let val = durationWrappers([e1, e2], { weekHours: weekHours })

          // Expect weekend to be skipped, time to split for overlap
          expect(_.map(val, (e) => e.duration)).toEqual(
            _.map([8 + 4, 4], (s) => Math.round(s * 60 * 60))
          );
        })
      });
    });


    //////

    describe("getSegments", function() {

      it("should truncate events that run past bounds", function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({
            start: XDate.toString(new Date(2016, 0, 1, 12)),
            end:   XDate.toString(new Date(2016, 0, 3, 12)),
          }));
        let start = new Date(2016, 0, 2, 0);
        let end = new Date(2016, 0, 2, 12);

        var segments = getSegments(e, {
          truncateStart: start,
          truncateEnd: end
        });
        expect(segments).toEqual([{
          start: start.getTime(),
          end: end.getTime()
        }]);
      });

      let weekHours = { // M @ 9am - F @ 5:30pm, continuous
        mon: Option.some({
          start: {hour: 9, minute: 0},
          end: {hour: 24, minute: 0}
        }),
        tue: Option.some({
          start: {hour: 0, minute: 0},
          end: {hour: 24, minute: 0}
        }),
        wed: Option.some({
          start: {hour: 0, minute: 0},
          end: {hour: 24, minute: 0}
        }),
        thu: Option.some({
          start: {hour: 0, minute: 0},
          end: {hour: 24, minute: 0}
        }),
        fri: Option.some({
          start: {hour: 0, minute: 0},
          end: {hour: 17, minute: 30}
        }),
        sat: Option.none<Types.DayHours>(),
        sun: Option.none<Types.DayHours>()
      }

      it("should truncate events based on working hours", function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({ // Friday
            start: XDate.toString(new Date(2016, 0, 1, 5)),
            end:   XDate.toString(new Date(2016, 0, 1, 18)),
          }));
        let segments = getSegments(e, { weekHours: weekHours });
        expect(segments).toEqual([{
          start: (new Date(2016, 0, 1, 5)).getTime(),
          end: (new Date(2016, 0, 1, 17, 30)).getTime(),
        }]);
      });

      it("should truncate multi-day events based on working hours",
      function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({
            start: XDate.toString(new Date(2016, 0, 1, 5)),  // Friday
            end:   XDate.toString(new Date(2016, 0, 4, 18)), // Monday
          }));
        let segments = getSegments(e, { weekHours: weekHours });

        // Expect weekend to be skipped
        expect(segments).toEqual([{
          start: (new Date(2016, 0, 1, 5)).getTime(),
          end: (new Date(2016, 0, 1, 17, 30)).getTime()
        }, {
          start: (new Date(2016, 0, 4, 9)).getTime(),
          end: (new Date(2016, 0, 4, 18)).getTime(),
        }]);
      });

      it("should preserve segments across days", function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({
            start: XDate.toString(new Date(2016, 0, 4, 20)),  // Monday
            end:   XDate.toString(new Date(2016, 0, 5, 4)),   // Tuesday
          }));
        let segments = getSegments(e, { weekHours: weekHours });

        /*
          Since Monday goes to midnight and Tuesday starts at midnight,
          expect to see a single segment covering both
        */
        expect(segments).toEqual([{
          start: (new Date(2016, 0, 4, 20)).getTime(),
          end: (new Date(2016, 0, 5, 4)).getTime()
        }]);
      });
    });


    //////

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
