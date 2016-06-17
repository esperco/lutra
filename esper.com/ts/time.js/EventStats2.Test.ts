/*
  Client-side time stat calculations
*/

/// <reference path="./EventStats2.ts" />

module Esper.EventStats {
  describe("EventStats2", function() {
    /*
      A single generic event for testing. Event itself doesn't matter in below,
      tests. We're probably just testing annotation value
    */
    var testEvent = Stores.Events.asTeamEvent(
      "team-id",
      TestFixtures.makeGenericCalendarEvent()
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

        expect(_.keys(results).length).toEqual(2);
        expect(_.map(results["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results["b"].annotations, (b) => b.value))
          .toEqual([6, 8]);
        expect(results["a"].total).toEqual(12);
        expect(results["b"].total).toEqual(14);
      });

      it("should let us populate existing groupings", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let a2 = makeAnnotation({ value: 7, groups: ["a"]});
        let b2 = makeAnnotation({ value: 8, groups: ["b"]});

        let results1 = groupAnnotations([a1, b1]);
        expect(_.keys(results1).length).toEqual(2);
        expect(_.map(results1["a"].annotations, (a) => a.value))
          .toEqual([5]);
        expect(_.map(results1["b"].annotations, (b) => b.value))
          .toEqual([6]);
        expect(results1["a"].total).toEqual(5);
        expect(results1["b"].total).toEqual(6);

        let results2 = groupAnnotations([a2, b2], results1);
        expect(_.keys(results2).length).toEqual(2);
        expect(_.map(results2["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results2["b"].annotations, (b) => b.value))
          .toEqual([6, 8]);
        expect(results2["a"].total).toEqual(12);
        expect(results2["b"].total).toEqual(14);
      });

      it("should nest groups", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let ab1 = makeAnnotation({ value: 7, groups: ["a", "b"]});
        let ab2 = makeAnnotation({ value: 8, groups: ["a", "b"]});
        let aa1 = makeAnnotation({ value: 9, groups: ["a", "a"]});
        let results = groupAnnotations([a1, b1, ab1, ab2, aa1]);

        /* Check parent */
        expect(_.keys(results).length).toEqual(2);
        expect(_.map(results["a"].annotations, (a) => a.value))
          .toEqual([5, 7, 8, 9]);
        expect(_.map(results["b"].annotations, (b) => b.value))
          .toEqual([6]);
        expect(results["a"].total).toEqual(29);
        expect(results["b"].total).toEqual(6);
        expect(results["b"].subgroups).toEqual({});

        /* Check nested subgroup A */
        var subA = results["a"].subgroups;
        expect(_.keys(subA).length).toEqual(2);
        expect(_.map(subA["a"].annotations, (a) => a.value))
          .toEqual([9]);
        expect(_.map(subA["b"].annotations, (b) => b.value))
          .toEqual([7, 8]);
        expect(subA["a"].total).toEqual(9);
        expect(subA["b"].total).toEqual(15);
        expect(subA["a"].subgroups).toEqual({});
        expect(subA["b"].subgroups).toEqual({});
      });
    });


    //////

    describe("Calculation", function() {

      /*
        This test calculation just assigns a value of 1 to a/b and 2 to a/c for
        each event, and processes two events per loop.
      */
      class TestCalc extends Calculation {
        MAX_PROCESS_EVENTS = 2

        annotate(event: Stores.Events.TeamEvent): Annotation[] {
          return [
            makeAnnotation({
              value: 1,
              groups: ["a", "b"]
            }),
            makeAnnotation({
              value: 2,
              groups: ["a", "c"]
            }),
          ];
        }
      }
      var events = [testEvent, testEvent, testEvent, testEvent, testEvent];

      /*
        Spy on requestAnimationFrame to step through events
      */
      describe("after start - sync", function() {
        var calc: TestCalc;
        var emitSpy: jasmine.Spy;

        beforeEach(function() {
          spyOn(window, "requestAnimationFrame");

          calc = new TestCalc();
          emitSpy = jasmine.createSpy("emit");
          calc.addChangeListener(emitSpy);
          calc.start(events);
        });

        it("should make async call to runLoop", function() {
          let asSpy = <jasmine.Spy> window.requestAnimationFrame;
          expect(asSpy.calls.count()).toEqual(1);
        });

        it("should process only only MAX_PROCESS_EVENTS after first loop",
        function() {
          calc.runLoop();
          expect(calc.eventQueue.length).toEqual(3);
          expect(calc.annotationsQueue.length).toEqual(4); // 2 per event = 4

          // Result should not be done yet
          expect(calc.getResults().isNone()).toBeTruthy();
        });

        it("should call runLoop again after first loop",
        function() {
          calc.runLoop();

          let asSpy = <jasmine.Spy> window.requestAnimationFrame;
          expect(asSpy.calls.count()).toEqual(2);
        });

        it("should start grouping after annotations are done", function() {
          /*
            First, clear annotations queue. 5 events / 2 events per run means
            at least 3 runs. Remainder should not have trigger next step yet.
          */
          calc.runLoop();
          calc.runLoop();
          calc.runLoop();

          // Result should not be done yet -- but we should have empty events
          // and full annotations queue
          expect(calc.getResults().isNone()).toBeTruthy();
          expect(calc.eventQueue.length).toEqual(0);
          expect(calc.annotationsQueue.length).toEqual(10); // 2 * 5

          // One RAF call for each loop plus init
          let asSpy = <jasmine.Spy> window.requestAnimationFrame;
          expect(asSpy.calls.count()).toEqual(4);

          // This loop should start grouping
          calc.runLoop();
          expect(calc.annotationsQueue.length).toEqual(8); // Two grouped

          // Still not done yet
          expect(calc.getResults().isNone()).toBeTruthy();
          expect(emitSpy).not.toHaveBeenCalled();
        });
      });

      /*
        Run the entire thing from start to finish
      */
      describe("after start - async", function() {
        var calc: TestCalc;

        beforeEach(function(done) {
          calc = new TestCalc();
          calc.addChangeListener(done);
          calc.start(events);
        });

        it("should return some result", function() {
          var result = calc.getResults();
          expect(result.isSome()).toBeTruthy();

          result.match({
            none: () => null,
            some: (g) => {
              expect(_.keys(g).length).toEqual(1);
              expect(_.keys(g["a"].subgroups).length).toEqual(2);

              let subB = g["a"].subgroups["b"];
              expect(subB.annotations.length).toEqual(5);
              expect(subB.total).toEqual(5);

              let subC = g["a"].subgroups["c"];
              expect(subC.annotations.length).toEqual(5);
              expect(subC.total).toEqual(10);
            }
          });
        });
      });
    });
  });
}
