// Tests for JQStore

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./JQStore.ts" />

module Esper {
  describe("JQStore", function() {
    var sandbox: JQuery;

    beforeEach(function() {
      sandbox = $("<div>");
      $("body").append(sandbox);
      this.store = new JQStore();
    });

    afterEach(function() {
      sandbox.remove();
    });

    it("should get what is set", function() {
      var elm = $("<span>");
      this.store.set(elm);
      sandbox.append(elm);
      expect(this.store.get()).toBe(elm);
    });

    it("should get nothing if unset", function() {
      var elm = $("<span>");
      this.store.set(elm);
      sandbox.append(elm);
      this.store.unset();
      expect(this.store.get()).toBeUndefined();
    });

    it("should automatically unset if removed from DOM", function() {
      var elm = $("<span>");
      this.store.set(elm);
      sandbox.append(elm);
      elm.remove();
      expect(this.store.get()).toBeUndefined();
    });

    it("should automatically unset if parent elm removed from DOM", function() {
      var parent = $("<p>")
      var elm = $("<span>");
      this.store.set(elm);
      parent.append(elm);
      sandbox.append(parent);
      parent.remove();
      expect(this.store.get()).toBeUndefined();
    });
  });
}