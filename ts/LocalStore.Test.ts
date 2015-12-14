/* Test LocalStore */

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./LocalStore.ts"/>

module Esper.LocalStore {
  describe("LocalStore", function() {
    beforeEach(function() {
      clear();
    });

    it("get + set should retrieve set data based on key", function() {
      set("key1", {cat: 5});
      set("key2", {dog: 6});
      expect(get("key1")).toEqual({cat: 5});
      expect(get("key2")).toEqual({dog: 6});
    });

    it("remove should clear data", function() {
      set("key1", {cat: 5});
      remove("key1");
      expect(get("key1")).toBeUndefined();
    });

    describe("with localStorage disabled", function() {
      beforeEach(function() {
        spyOn(localStorage, "setItem").and.throwError("Nope");
        spyOn(localStorage, "getItem").and.throwError("Nope");
        spyOn(localStorage, "removeItem").and.throwError("Nope");

        // Clear cookies on current path
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i];
          var eqPos = cookie.indexOf("=");
          var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      });

      it("should still allow get + set using cookies", function() {
        set("key1", {cat: 5});
        set("key2", {dog: 6});
        expect(get("key1")).toEqual({cat: 5});
        expect(get("key2")).toEqual({dog: 6});
      });

      it("should still clear data with remove", function() {
        set("key1", {cat: 5});
        remove("key1");
        expect(get("key1")).toBeUndefined();
      });
    });
  });
}
