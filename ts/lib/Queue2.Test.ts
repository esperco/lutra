/// <reference path="./Queue2.ts"/>
module Esper.Queue2 {
  describe("Queue2.Processor", function() {
    var processor: Processor<string, string>;
    var dfd: JQueryDeferred<string>;
    var spy: jasmine.Spy;

    beforeEach(function() {
      dfd = $.Deferred();
      spy = jasmine.createSpy("process");
      spy.and.returnValue(dfd.promise());

      // Processor is spy, pre-processor groups first two args together
      processor = new Processor(spy, function(state: string[]) {
        if (state.length) {
          return [state.slice(0,2).join(" ")].concat(state.slice(2));
        }
        return [];
      });
    });

    it("should execute newly queued functions immediately", function() {
      processor.enqueue("k1", "a");
      expect(spy).toHaveBeenCalledWith("a");
    });

    it("should not process while waiting for promise to resolve", function() {
      processor.enqueue("k1", "a");
      processor.enqueue("k1", "b");
      expect(spy).toHaveBeenCalledWith("a");

      // First call has not resolved
      expect(spy.calls.count()).toEqual(1);
    });

    it("should process items enqueued later once earlier promise resolves",
      function()
    {
      processor.enqueue("k1", "a");
      processor.enqueue("k1", "b");
      expect(spy).toHaveBeenCalledWith("a");

      dfd.resolve("Hello");
      expect(spy).toHaveBeenCalledWith("b", "Hello");
    });

    it("should not execute functions enqueued later once earlier promise " +
       "rejects",
      function()
    {
      processor.enqueue("k1", "a");
      processor.enqueue("k1", "b");
      expect(spy).toHaveBeenCalledWith("a");

      dfd.reject(new Error("Whoops"));
      expect(spy.calls.count()).toEqual(1);
    });

    it("should return a promise that resolves when queue is empty",
      function()
    {
      var dfd1 = $.Deferred();
      var dfd2 = $.Deferred();
      processor.processFn = function(x: string) {
        if (x === "a") {
          return dfd1.promise();
        } else {
          return dfd2.promise();
        }
      }

      var p1 = processor.enqueue("k1", "a");
      var p2 = processor.enqueue("k1", "b");

      // Same promise because p2 created before p1 resolved
      expect(p1).toBe(p2);
      expect(p1.state()).toBe("pending");

      dfd1.resolve("");
      expect(p1.state()).toBe("pending"); // Waiting on dfd2

      dfd2.resolve("");
      expect(p1.state()).toBe("resolved");
    });

    it("should return a promise that resolves to the result of the last " +
       "promise in the queue, if any",
    function() {
      var dfd1 = $.Deferred();
      var dfd2 = $.Deferred();
      processor.processFn = function(x: string) {
        if (x === "a") {
          return dfd1.promise();
        } else {
          return dfd2.promise();
        }
      }

      var p1Ret: string;
      processor.enqueue("k1", "a").done((ret) => p1Ret = ret);
      var p2Ret: string;
      processor.enqueue("k1", "b").done((ret) => p2Ret = ret);

      dfd1.resolve("1");
      dfd2.resolve("2");

      expect(p1Ret).toEqual("2");
      expect(p2Ret).toEqual("2");
    });

    it("should return new promises for queueing after queue emptied",
      function()
    {
      var p1 = processor.enqueue("k1", "a");
      dfd.resolve("x");

      var p2 = processor.enqueue("k2", "b");
      expect(p1).not.toBe(p2);
    });

    it("should reset queue if any enqueued promises fail", function() {
      var p1 = processor.enqueue("k1", "a");
      var p2 = processor.enqueue("k1", "b");

      spy.calls.reset();
      dfd.reject(new Error("Whoops"));
      processor.enqueue("k1", "c");

      expect(spy).toHaveBeenCalledWith("c");
      expect(spy.calls.count()).toEqual(1);
      expect(p2.state()).toEqual("rejected");
    });

    it("should run state items through pre-processor", function() {
      processor.enqueue("k1", "a");
      processor.enqueue("k1", "b");
      processor.enqueue("k1", "c");
      processor.enqueue("k1", "d");
      expect(spy).toHaveBeenCalledWith("a");

      spy.and.returnValue($.Deferred().promise());
      dfd.resolve("Hello");
      expect(spy).toHaveBeenCalledWith("b c", "Hello");
      expect(spy.calls.count()).toEqual(2);
    });

    it("should not call pre-processor with undefined or empty state",
      function()
    {
      var preSpy = spyOn(processor, "preFn").and.callThrough();
      processor.enqueue("k1", "a");
      processor.enqueue("k1", "b");
      dfd.resolve("Hello");
      expect(preSpy).not.toHaveBeenCalledWith(undefined);
      expect(preSpy).not.toHaveBeenCalledWith([]);
    });

    it("should allow multiple non-blocking keys", function() {
      processor.enqueue("k1", "a");
      processor.enqueue("k2", "b");

      expect(spy).toHaveBeenCalledWith("a");
      expect(spy).toHaveBeenCalledWith("b");
    });
  });
}

