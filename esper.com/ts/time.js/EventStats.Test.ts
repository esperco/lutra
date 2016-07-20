/*
  Client-side time stat calculations
*/

/// <reference path="./EventStats.ts" />

module Esper.EventStats {
  describe("EventStats", function() {
    const teamId = "teamId";
    const calId = "calId";

    /*
      A single generic event for testing. Event itself doesn't matter in below,
      tests. We're probably just testing annotation value
    */
    var testEvent = Stores.Events.asTeamEvent(
      teamId, TestFixtures.makeGenericCalendarEvent()
    );

    // Inactive event calculations should ignore
    var noAttendEvent = Stores.Events.asTeamEvent(
      teamId, TestFixtures.makeGenericCalendarEvent({
        feedback: { attended: false }
      })
    );

    // Helper function
    function makeAnnotation(p: {
      value: number;
      groups: string[];
    }): Annotation {
      return {
        event: testEvent,
        value: p.value,
        groups: p.groups
      };
    }

    describe("groupAnnotations", function() {
      it("should group annotations", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let a2 = makeAnnotation({ value: 7, groups: ["a"]});
        let b2 = makeAnnotation({ value: 8, groups: ["b"]});
        let results = groupAnnotations([a1, b1, b2, a2]);

        expect(_.keys(results.some).length).toEqual(2);
        expect(_.map(results.some["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results.some["b"].annotations, (b) => b.value))
          .toEqual([6, 8]);
        expect(results.some["a"].totalValue).toEqual(12);
        expect(results.some["b"].totalValue).toEqual(14);
      });

      it("should count empty sets", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let a2 = makeAnnotation({ value: 7, groups: ["a"]});
        let b2 = makeAnnotation({ value: 8, groups: []});
        let results = groupAnnotations([a1, b1, b2, a2]);

        expect(_.keys(results.some).length).toEqual(2);
        expect(_.map(results.some["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results.some["b"].annotations, (b) => b.value))
          .toEqual([6]);
        expect(_.map(results.none.annotations, (b) => b.value))
          .toEqual([8]);
        expect(results.some["a"].totalValue).toEqual(12);
        expect(results.some["b"].totalValue).toEqual(6);
        expect(results.none.totalValue).toEqual(8);
      });

      it("should let us populate existing groupings", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let a2 = makeAnnotation({ value: 7, groups: ["a"]});
        let b2 = makeAnnotation({ value: 8, groups: ["b"]});

        let results1 = groupAnnotations([a1, b1]);
        expect(_.keys(results1.some).length).toEqual(2);
        expect(_.map(results1.some["a"].annotations, (a) => a.value))
          .toEqual([5]);
        expect(_.map(results1.some["b"].annotations, (b) => b.value))
          .toEqual([6]);
        expect(results1.some["a"].totalValue).toEqual(5);
        expect(results1.some["b"].totalValue).toEqual(6);

        let results2 = groupAnnotations([a2, b2], results1);
        expect(_.keys(results2.some).length).toEqual(2);
        expect(_.map(results2.some["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results2.some["b"].annotations, (b) => b.value))
          .toEqual([6, 8]);
        expect(results2.some["a"].totalValue).toEqual(12);
        expect(results2.some["b"].totalValue).toEqual(14);
      });

      it("should nest groups", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let ab1 = makeAnnotation({ value: 7, groups: ["a", "b"]});
        let ab2 = makeAnnotation({ value: 8, groups: ["a", "b"]});
        let aa1 = makeAnnotation({ value: 9, groups: ["a", "a"]});
        let results = groupAnnotations([a1, b1, ab1, ab2, aa1]);

        /* Check parent */
        expect(_.keys(results.some).length).toEqual(2);
        expect(_.map(results.some["a"].annotations, (a) => a.value))
          .toEqual([5, 7, 8, 9]);
        expect(_.map(results.some["b"].annotations, (b) => b.value))
          .toEqual([6]);
        expect(results.some["a"].totalValue).toEqual(29);
        expect(results.some["b"].totalValue).toEqual(6);
        expect(results.some["b"].subgroups).toEqual({});

        /* Check nested subgroup A */
        var subA = results.some["a"].subgroups;
        expect(_.keys(subA).length).toEqual(2);
        expect(_.map(subA["a"].annotations, (a) => a.value))
          .toEqual([9]);
        expect(_.map(subA["b"].annotations, (b) => b.value))
          .toEqual([7, 8]);
        expect(subA["a"].totalValue).toEqual(9);
        expect(subA["b"].totalValue).toEqual(15);
        expect(subA["a"].subgroups).toEqual({});
        expect(subA["b"].subgroups).toEqual({});
      });

      it("should track unique events", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        expect(groupAnnotations([a1, b1]).totalUnique).toEqual(1);
      });
    });


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

    // Default options for calc
    const defaultOpts: EventStats.CalcOpts = {
      filterStr: "",
      labels: { all: true, none: true, some: [] },
      domains: { all: true, none: true, some: [] },
      durations: { all: true, none: true, some: [] },
      guestCounts: { all: true, none: true, some: [] },
      ratings: { all: true, none: true, some: [] },
      weekHours: Params.weekHoursAll()
    }

    describe("Calculation", function() {

      /*
        This test calculation just assigns a value of 1 to a/b and 2 to a/c for
        each event, and processes two events per loop.
      */
      class TestCalc extends EventListCalc<number[], {}> {
        MAX_PROCESS_EVENTS = 2

        constructor(events: Stores.Events.TeamEvent[]) {
          super(events, defaultOpts);
        }

        initResult(): number[] { return []; }

        /*
          Stub out calls that require team for purpose of test. We'd do this
          with a spy, but making this work asynchronously is a bother.
        */
        filterEvent(event: Stores.Events.TeamEvent) {
          var oldRequire = Stores.Teams.require;
          Stores.Teams.require = function(teamId: string) {
            return TestFixtures.makeTeam({ teamid: teamId });
          }
          let ret = super.filterEvent(event);
          Stores.Teams.require = oldRequire;
          return ret;
        }

        processBatch(events: Stores.Events.TeamEvent[], result: number[])
        {
          result = result.concat(
            _.times(events.length, () => this._index)
          );
          return result;
        }
      }
      var events = [testEvent, testEvent, testEvent, testEvent, noAttendEvent];

      /*
        Spy on requestAnimationFrame to step through events
      */
      describe("after start - sync", function() {
        var calc: TestCalc;
        var rAFSpy: jasmine.Spy;
        var emitSpy: jasmine.Spy;

        beforeEach(function() {
          rAFSpy = spyOn(window, "requestAnimationFrame");

          calc = new TestCalc(events);
          emitSpy = jasmine.createSpy("emit");
          calc.addChangeListener(emitSpy); // Triggers start
        });

        it("should make async call to runLoop", function() {
          expect(rAFSpy.calls.count()).toEqual(1);
        });

        it("should process only MAX_PROCESS_EVENTS after first loop",
        function() {
          calc.runLoop();
          expect(calc._index).toEqual(2);
          expect(calc._results.length).toEqual(2);

          // Result should not be done yet
          expect(calc.getResults().isNone()).toBeTruthy();
          expect(emitSpy).not.toHaveBeenCalled();
        });

        it("should call runLoop again after first loop",
        function() {
          calc.runLoop();
          expect(rAFSpy.calls.count()).toEqual(2);
        });

        it("should not call runLoop again if stopped",
        function() {
          calc.stop();
          calc.runLoop();
          expect(rAFSpy.calls.count()).toEqual(1);
        });

        it("should ignore no-attend events by default", function() {
          calc.runLoop();
          calc.runLoop();
          calc.runLoop();
          expect(calc._results.length).toEqual(4); // Last event is no-attend
        });
      });

      /*
        Run the entire thing from start to finish
      */
      describe("after start - async", function() {
        var calc: TestCalc;

        beforeEach(function(done) {
          calc = new TestCalc(events);
          calc.addChangeListener(done);
        });

        it("should return some result", function() {
          var result = calc.getResults();
          expect(result.isSome()).toBeTruthy();

          result.match({
            none: () => null,
            some: (g) => {
              expect(g).toEqual([2, 2, 4, 4]);
            }
          });
        });
      });

      describe("after extra starts", function() {
        var calc: TestCalc;
        var emitSpy: jasmine.Spy;
        var loopSpy: jasmine.Spy;

        beforeEach(function(done) {
          calc = new TestCalc(events);
          emitSpy = jasmine.createSpy("test");
          loopSpy = spyOn(calc, "runLoop").and.callThrough();

          calc.addChangeListener(emitSpy);

          // Done should be in next stack to let any listeners finish firing
          calc.addChangeListener(function() {
            window.requestAnimationFrame(done);
          });

          calc.start();
          calc.start();
        });

        it("should not result in extra loop runs or emits", function() {
          var result = calc.getResults();
          expect(result.isSome()).toBeTruthy();
          expect(emitSpy.calls.count()).toEqual(1);
        });
      });
    });


    //////

    describe("Duration Calculation", function() {

      /*
        This test calculation just assigns a value of 1 to a/b and 2 to a/c for
        each event, and processes two events per loop.
      */
      class TestCalc extends DurationCalc<number[], {}> {
        MAX_PROCESS_EVENTS = 2

        constructor(events: Stores.Events.TeamEvent[]) {
          super(events, defaultOpts);
        }

        initResult(): number[] { return []; }

        /*
          Stub out calls that require team for purpose of test. We'd do this
          with a spy, but making this work asynchronously is a bother.
        */
        filterEvent(event: Stores.Events.TeamEvent) {
          var oldRequire = Stores.Teams.require;
          Stores.Teams.require = function(teamId: string) {
            return TestFixtures.makeTeam({ teamid: teamId });
          }
          let ret = super.filterEvent(event);
          Stores.Teams.require = oldRequire;
          return ret;
        }

        processOne(event: Stores.Events.TeamEvent,
                   duration: number,
                   result: number[]): number[] {
          return (result || []).concat([duration]);
        }
      }

      var e1 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 1, 22)),
          end:   XDate.toString(new Date(2016, 0, 1, 23)),
        }));
      var e2 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 1)),
          end:   XDate.toString(new Date(2016, 0, 2, 5)),
        }));

      // Overlaps 2
      var e3 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 2)),
          end:   XDate.toString(new Date(2016, 0, 2, 3)),
        }));

      // Overlaps 2 but is not active
      var e4 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          feedback: { attended: false },
          start: XDate.toString(new Date(2016, 0, 2, 4)),
          end:   XDate.toString(new Date(2016, 0, 2, 6)),
        }));

      // Overlaps 2
      var e5 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 4)),
          end:   XDate.toString(new Date(2016, 0, 2, 6)),
        }));

      // Does not overlap 4
      var e6 = Stores.Events.asTeamEvent("team-id",
        TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 6)),
          end:   XDate.toString(new Date(2016, 0, 2, 7)),
        }));
      var events = [e1, e2, e3, e4, e5, e6];

      /*
        Spy on requestAnimationFrame to step through events
      */
      describe("after start - sync", function() {
        var calc: TestCalc;

        beforeEach(function() {
          spyOn(window, "requestAnimationFrame"); // To stop loop

          calc = new TestCalc(events);
          calc.start();
        });

        it("should process only MAX_PROCESS_EVENTS + any overlapping " +
           "events after first loop",
        function() {
          calc.runLoop();
          expect(calc._index).toEqual(5);

          // NB: Only 4 because we excluded inactive event
          expect(calc._results.length).toEqual(4);

          // Result should not be done ye`t
          expect(calc.getResults().isNone()).toBeTruthy();
        });

        it("should pass durations to processOne function", function() {
          var spy = spyOn(calc, "processOne").and.callThrough();

          calc.runLoop();
          expect(spy.calls.argsFor(0).slice(0,2)).toEqual([e1, 1 * 60 * 60]);
          expect(spy.calls.argsFor(1).slice(0,2)).toEqual([e2, 3 * 60 * 60]);
          expect(spy.calls.argsFor(2).slice(0,2)).toEqual([e3, 0.5 * 60 * 60]);
          expect(spy.calls.argsFor(3).slice(0,2)).toEqual([e5, 1.5 * 60 * 60]);

          // e4 is excluded because of did not attend
          expect(spy.calls.count()).toEqual(4);
        });
      });
    });


    ////

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
