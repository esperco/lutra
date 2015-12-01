/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./ApiC.ts" />
module Esper.ApiC {
  var ApiTest = {
    testFn: function(arg1: string, arg2: {sub1: string, sub2: number}) {
      return $.Deferred().promise();
    }
  };

  describe("makeC wrapped function", function() {
    beforeEach(function() {
      jasmine.clock().install();

      this.dfd = $.Deferred();
      this.promise = this.dfd.promise();
      this.listener = spyOn(ApiTest, "testFn").and.returnValue(this.promise);
      this.timeout = 60000
      this.cFn = makeC(ApiTest.testFn, {
        timeout: this.timeout
      });
      this.cFn.store.reset();
      this.cFn.store.removeAllChangeListeners();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it("should call original and return its return value", function() {
      var arg2 = {sub1: "b", sub2: 2};
      expect(this.cFn("a", arg2)).toBe(this.promise);
      expect(ApiTest.testFn).toHaveBeenCalledWith("a", arg2);
    });

    it("should not call original twice if promise pending", function() {
      expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(this.promise);
      expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(this.promise);
      expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(1);
    });

    it("should return a new promise if the old one fails", function() {
      expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(this.promise);
      this.dfd.reject(new Error("Boom"));

      var promise2 = $.Deferred().promise();
      (<jasmine.Spy> ApiTest.testFn).and.returnValue(promise2);
      expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(promise2);
      expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(2);
    });

    it("should return a new promise if passed different args", function() {
      expect(this.cFn("a", {sub1: "b", sub2: 3})).toBe(this.promise);

      var promise2 = $.Deferred().promise();
      (<jasmine.Spy> ApiTest.testFn).and.returnValue(promise2);
      expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(promise2);
      expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(2);
    });

    it("should return a promise that resolves with cached value on success",
    function() {
      this.cFn("a", {sub1: "b", sub2: 2});
      var ret = {ret1: "A", ret2: 2};
      this.dfd.resolve(ret);

      // Reset fake
      (<jasmine.Spy> ApiTest.testFn).and.returnValue($.Deferred().promise());

      // Second call should get cached call
      var promise = this.cFn("a", {sub1: "b", sub2: 2});
      var actual: any;
      promise.done(function(ret: any) {
        actual = ret;
      });
      expect(actual).toBe(ret);
      expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(1);
    });

    describe("store", function() {
      beforeEach(function() {
        this.args = ["a", {sub1: "b", sub2: 2}];
        this.keyStr = this.cFn.strFunc(this.args);
        this.cFn.apply(null, this.args);

        this.listener = jasmine.createSpy("listener");
        this.cFn.store.addChangeListener(this.listener);
      });

      it("should mark value in store as FETCHING", function() {
        expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
          Model.DataStatus.FETCHING);
        expect(this.listener).not.toHaveBeenCalled();
      });

      it("should update store on success", function() {
        var ret = {ret1: "A", ret2: 2}
        this.dfd.resolve(ret);
        expect(this.cFn.store.val(this.keyStr)).toEqual(ret);
        expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
          Model.DataStatus.READY);
        expect(this.listener).toHaveBeenCalled();
      });

      it("should update store on failure", function() {
        var err = new Error("Oops");
        this.dfd.reject(err);
        expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
          Model.DataStatus.FETCH_ERROR);
        expect(this.cFn.store.metadata(this.keyStr).lastError).toBe(err);
        expect(this.listener).toHaveBeenCalled();
      });

      describe("with unsaved store data", function() {
        beforeEach(function() {
          this.cFn.store.update(this.keyStr, [null, {
            dataStatus: Model.DataStatus.UNSAVED
          }]);
        });

        it("should not clobber unsaved store data on success", function() {
          var ret = {ret1: "A", ret2: 2}
          this.dfd.resolve(ret);
          expect(this.cFn.store.val(this.keyStr)).toEqual(null);
          expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
            Model.DataStatus.UNSAVED);
        });

        it("should not clobber unsaved store data on failure", function() {
          this.dfd.reject(new Error("Whoops"));
          expect(this.cFn.store.val(this.keyStr)).toEqual(null);
          expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
            Model.DataStatus.UNSAVED);
        });
      });

      describe("with inflight store data", function() {
        beforeEach(function() {
          this.cFn.store.update(this.keyStr, [null, {
            dataStatus: Model.DataStatus.INFLIGHT
          }]);
        });

        it("should not clobber unsaved store data on success", function() {
          var ret = {ret1: "A", ret2: 2}
          this.dfd.resolve(ret);
          expect(this.cFn.store.val(this.keyStr)).toEqual(null);
          expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
            Model.DataStatus.INFLIGHT);
        });

        it("should not clobber unsaved store data on failure", function() {
          this.dfd.reject(new Error("Whoops"));
          expect(this.cFn.store.val(this.keyStr)).toEqual(null);
          expect(this.cFn.store.metadata(this.keyStr).dataStatus).toBe(
            Model.DataStatus.INFLIGHT);
        });
      });
    });

    describe("after timeout", function() {
      beforeEach(function() {
        jasmine.clock().mockDate(new Date(2015,1,1));

        // Simulate successful call and cache
        this.cFn("a", {sub1: "b", sub2: 2});
        var ret = {ret1: "A", ret2: 2};
        this.dfd.resolve(ret);

        // Reset fake
        this.promise2 = $.Deferred().promise();
        (<jasmine.Spy> ApiTest.testFn).and.returnValue(this.promise2);

        // Wait longer than timeout
        jasmine.clock().tick(this.timeout + 1);
      });

      it("should return a new promise", function() {
        expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(this.promise2);
        expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(2);
      });
    });

    describe("multiple times with shared store", function() {
      beforeEach(function() {
        this.cFn2 = makeC(ApiTest.testFn, {
          timeout: this.timeout,
          store: this.cFn.store
        });
      });

      it("should store identical API calls for different functions under " +
         "different keys by default", function()
      {
        expect(this.cFn("a", {sub1: "b", sub2: 2})).toBe(this.promise);
        expect(this.cFn2("a", {sub1: "b", sub2: 2})).toBe(this.promise);
        expect((<jasmine.Spy> ApiTest.testFn).calls.count()).toEqual(2);
        expect(this.cFn.store.getAll().length).toEqual(2);
      });
    });
  });
}