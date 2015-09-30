/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Query.ts" />

module Esper.Query {
  class QTest extends Manager<{name: string}, string> {
    addSubListeners() {}
    removeSubListeners() {}

    getData(key: {name: string}): string {
      return key.name;
    }

    getAsync(key: {name: string}): JQueryPromise<any> {
      return $.Deferred().promise();
    }
  }

  describe("Query.Manager", function() {
    beforeEach(function() {
      this.manager = new QTest();
      this.key = { name: "Alvin" };
      this.deferred = $.Deferred();
      spyOn(this.manager, "getAsync")
        .and.returnValue(this.deferred.promise());
    });

    it("get should return value", function() {
      expect(this.manager.get(this.key)[0]).toEqual("Alvin");
    });

    it("get should return metadata", function() {
      var metadata = this.manager.get(this.key)[1];
      expect(metadata.updateInProgress).toBe(true);
    });

    it("should schedule async call only once", function() {
      this.manager.get(this.key);

      // Call with functionally identical key -- test with this rather than
      // using this.key directly to test that we're doing a more sophisticated
      // comparison check that simple identity
      this.manager.get({ name: this.key.name });
      expect(this.manager.getAsync.calls.count()).toEqual(1);
    });

    describe("after resolving async", function() {
      beforeEach(function() {
        this.manager.get(this.key);
        this.deferred.resolve();
      });

      it("should not block subsequent asyncs", function() {
        this.manager.get(this.key);
        expect(this.manager.getAsync.calls.count()).toEqual(2);
      });
    });

    describe("after rejecting async", function() {
      beforeEach(function() {
        this.manager.get(this.key);
        this.deferred.reject();
      });

      it("should not block subsequent asyncs", function() {
        this.manager.get(this.key);
        expect(this.manager.getAsync.calls.count()).toEqual(2);
      });
    });

    describe("shouldGetAsync returning false", function() {
      beforeEach(function() {
        spyOn(this.manager, "shouldGetAsync").and.returnValue(false);
      });

      it("should prevent async call", function() {
        var metadata = this.manager.get(this.key)[1];
        expect(metadata.updateInProgress).toBe(false);
        expect(this.manager.getAsync).not.toHaveBeenCalled();
      });
    });

    describe("with different arguments", function() {
      beforeEach(function() {
        this.key2 = { name: "Theodore" };
        this.manager.get(this.key);
        this.manager.get(this.key2);
      });

      it("should not block each other", function() {
        expect(this.manager.getAsync.calls.count()).toEqual(2);
        expect(this.manager.getAsync).toHaveBeenCalledWith(this.key);
        expect(this.manager.getAsync).toHaveBeenCalledWith(this.key2);
      });
    });
  });
}