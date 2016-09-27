/// <reference path="./Calc.ts" />

module Esper {

  // Returns a simple calculation that adds up numbers 2 at a time
  interface State {
    next: number[];
    sum: number;
  }

  function makeCalc() {
    return new Calc<State>({
        next: [1, 2, 3, 4, 5],
        sum: 0
      },

      (x) => ({
        next: {
          next: x.next.slice(2),
          sum:  x.sum + _.sum(x.next.slice(0, 2))
        },
        done: !x.next.length
      })
    );
  }

  describe("Calculation", function() {

    /*
      Spy on requestAnimationFrame to step through events
    */
    describe("after start - sync", function() {
      var calc: Calc<State>;
      var rAFSpy: jasmine.Spy;
      var emitSpy: jasmine.Spy;

      beforeEach(function() {
        rAFSpy = spyOn(window, "requestAnimationFrame");

        calc = makeCalc();
        emitSpy = jasmine.createSpy("emit");
        calc.addChangeListener(emitSpy); // Triggers start
      });

      it("should make async call to runLoop", function() {
        expect(rAFSpy.calls.count()).toEqual(1);
      });

      it("should call process function once and store state after first loop",
      function() {
        calc.runLoop();
        expect(calc._state).toEqual({
          next: [3, 4, 5],
          sum: 3
        });

        // Result should not be done yet
        expect(calc.getOutput().isNone()).toBeTruthy();
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
    });

    /*
      Run the entire thing from start to finish
    */
    describe("after start - async", function() {
      var calc: Calc<State>;

      beforeEach(function(done) {
        calc = makeCalc();
        calc.addChangeListener(done);
      });

      it("should return some result", function() {
        var result = calc.getOutput();
        expect(result.isSome()).toBeTruthy();

        result.match({
          none: () => null,
          some: (g) => {
            expect(g.sum).toEqual(1 + 2 + 3 + 4 + 5);
          }
        });
      });
    });

    describe("after extra starts", function() {
      var calc: Calc<State>;
      var emitSpy: jasmine.Spy;
      var loopSpy: jasmine.Spy;

      beforeEach(function(done) {
        calc = makeCalc();
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
        var result = calc.getOutput();
        expect(result.isSome()).toBeTruthy();
        expect(emitSpy.calls.count()).toEqual(1);
      });
    });
  });
}
