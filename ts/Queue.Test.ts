/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Queue.ts"/>
module Esper.Queue {
  describe("Queue.enqueue", function() {
    beforeEach(function() {
      reset();
      this.qKey = "queue1";
    });

    it("should execute newly queued functions immediately", function() {
      var fn = jasmine.createSpy("queue");
      Queue.enqueue(this.qKey, fn);
      expect(fn).toHaveBeenCalled();
    });

    it("should execute multiple newly queued functions until a promise is " +
       "returned", function() {
      var fn1 = jasmine.createSpy("queue1");
      Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      fn2.and.returnValue($.Deferred().promise());
      Queue.enqueue(this.qKey, fn2);

      var fn3 = jasmine.createSpy("queue3");
      Queue.enqueue(this.qKey, fn3);

      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled(); // Waiting on fn2's promise
    });

    it("should execute functions enqueued later once earlier promise resolves",
      function()
    {
      var fn1 = jasmine.createSpy("queue1");
      var dfd = $.Deferred();
      fn1.and.returnValue(dfd.promise());
      Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      Queue.enqueue(this.qKey, fn2);
      var fn3 = jasmine.createSpy("queue3");
      Queue.enqueue(this.qKey, fn3);

      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();

      /////

      dfd.resolve();
      expect(fn2).toHaveBeenCalled();
      expect(fn3).toHaveBeenCalled();
    });

    it("should not execute functions enqueued later once earlier promise " +
       "rejects",
      function()
    {
      var fn1 = jasmine.createSpy("queue1");
      var dfd = $.Deferred();
      fn1.and.returnValue(dfd.promise());
      Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      Queue.enqueue(this.qKey, fn2);
      var fn3 = jasmine.createSpy("queue3");
      Queue.enqueue(this.qKey, fn3);

      /////

      dfd.reject();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
    });

    it("should return a promise that resolves when queue is empty", function() {
      var fn1 = jasmine.createSpy("queue1");
      var dfd1 = $.Deferred();
      fn1.and.returnValue(dfd1.promise());
      var p1 = Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      var dfd2 = $.Deferred();
      fn2.and.returnValue(dfd2.promise());
      var p2 = Queue.enqueue(this.qKey, fn2);

      // Same promise for queue emptying because p2 created before p1
      // resolved
      expect(p1).toBe(p2);
      expect(p1.state()).toBe("pending");

      dfd1.resolve();
      expect(p1.state()).toBe("pending"); // Waiting on dfd2

      dfd2.resolve();
      expect(p1.state()).toBe("resolved");
    });

    it("should return new promises for queueing after queue emptied",
      function()
    {
      var fn1 = jasmine.createSpy("queue1");
      var dfd1 = $.Deferred();
      fn1.and.returnValue(dfd1.promise());
      var p1 = Queue.enqueue(this.qKey, fn1);
      dfd1.resolve();

      var fn2 = jasmine.createSpy("queue2");
      var dfd2 = $.Deferred();
      fn2.and.returnValue(dfd2.promise());
      var p2 = Queue.enqueue(this.qKey, fn2);

      expect(p1).not.toBe(p2);
      expect(p1.state()).toBe("resolved");
      expect(p2.state()).toBe("pending");

      dfd2.resolve();
      expect(p2.state()).toBe("resolved");
    });

    it("should return a promise that rejects if any of the promises fail",
      function()
    {
      var fn1 = jasmine.createSpy("queue1");
      var dfd1 = $.Deferred();
      fn1.and.returnValue(dfd1.promise());
      var p1 = Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      var dfd2 = $.Deferred();
      fn2.and.returnValue(dfd2.promise());
      var p2 = Queue.enqueue(this.qKey, fn2);

      // Same promise for queue emptying because p2 created before p1
      // resolved
      expect(p1).toBe(p2);
      dfd1.resolve();
      dfd2.reject();
      expect(p1.state()).toBe("rejected");
    });

    it("should reset queue if any enqueued promises fail", function() {
      var fn1 = jasmine.createSpy("queue1");
      var dfd1 = $.Deferred();
      fn1.and.returnValue(dfd1.promise());
      Queue.enqueue(this.qKey, fn1);

      var fn2 = jasmine.createSpy("queue2");
      var dfd2 = $.Deferred();
      fn2.and.returnValue(dfd2.promise());
      var p2 = Queue.enqueue(this.qKey, fn2);

      dfd1.reject();

      var fn3 = jasmine.createSpy("queue3");
      var dfd3 = $.Deferred();
      fn3.and.returnValue(dfd3.promise());
      var p3 = Queue.enqueue(this.qKey, fn3);

      expect(p2).not.toBe(p3);
      expect(p2.state()).toBe("rejected");
      expect(fn2).not.toHaveBeenCalled();
      expect(p3.state()).toBe("pending");
      expect(fn3).toHaveBeenCalled();
    });
  });
}
