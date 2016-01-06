/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Util.ts"/>
module Esper.Util {

  describe("Util", function() {
    describe("deepFreeze", function() {
      it("should prevent shallow updates", function() {
        var o: any = deepFreeze({ x: 5 });
        o.x === 6;
        expect(o.x).toBe(5);
      });

      it("should prevent shallow additions", function() {
        var o: any = deepFreeze({ x: 5 });
        o.y === 6;
        expect(o.y).toBeUndefined();
      });

      it("should prevent deep updates", function() {
        var o: any = deepFreeze({ x: {y: 5 }});
        o.x.y === 6;
        expect(o.x.y).toBe(5);
      });

      it("should prevent deep additions", function() {
        var o: any = deepFreeze({ x: {y: 5 }});
        o.x.z === 6;
        expect(o.x.z).toBeUndefined();
      });

      it("should not call isFrozen on non-objects", function() {
        spyOn(Object, "isFrozen");
        expect(deepFreeze(5)).toBe(5);
        expect(Object.isFrozen).not.toHaveBeenCalled();
      });
    });

    describe("pushToCapped", function() {
      beforeEach(function() {
        jasmine.addCustomEqualityTester(_.isEqual);
      });

      it("should push new items to end of list", function() {
        var l = [1];
        Util.pushToCapped(l, 2, 100);
        expect(l).toEqual([1, 2]);
      });

      it("should push to end but not duplicate items in list", function() {
        var l = [1, 2];
        Util.pushToCapped(l, 1, 100);
        Util.pushToCapped(l, 3, 100);
        expect(l).toEqual([2, 1, 3]);
      });

      it("should allow custom functions for checking duplication", function() {
        var l = [1, 3];
        var eq = function(a: number, b: number) {
          return a % 2 === b % 2;
        }
        Util.pushToCapped(l, 4, 100, eq);
        expect(l).toEqual([1, 3, 4]);
        Util.pushToCapped(l, 5, 100, eq);
        expect(l).toEqual([4, 5]);
      });

      it("should remove items in FIFO order to preserve cap and return them",
      function() {
        var l = [1, 2];
        expect(Util.pushToCapped(l, 3, 3)).toBeUndefined();
        expect(Util.pushToCapped(l, 4, 3)).toBe(1);
        expect(l).toEqual([2, 3, 4]);
      });
    });

    describe("cmpStringify", function() {
      it("should return the same string for identifical objects regardless " +
         "of key order",
      function() {
        var a = {x: 5, y: 6};
        var b = {y: 6, x: 5};
        expect(cmpStringify(a)).toEqual(cmpStringify(b));
      });

      it("should not return the same string for different objects",
      function() {
        var a = {x: 5, y: 6};
        var b = {x: 6, y: 5};
        expect(cmpStringify(a)).not.toEqual(cmpStringify(b));
      });

      it("should handle nested objects", function() {
        var a = {x: 5, y: {a: 6, b: 7}};
        var b = {y: {b: 7, a: 6}, x: 5};
        expect(cmpStringify(a)).toEqual(cmpStringify(b));

        var c = {x: 5, y: {a: 6, b: 7}};
        var d = {x: 5, y: {a: 6, b: 8}};
        expect(cmpStringify(c)).not.toEqual(cmpStringify(d));
      });

      it("should handle non-objects", function() {
        expect(cmpStringify(1)).toEqual(cmpStringify(1));
        expect(cmpStringify(1)).not.toEqual(cmpStringify("1"));
      });
    });

    describe("hexEncode / hexDecode", function() {
      it("should encode and decode each other", function() {
        var s = "Hello World";
        expect(hexDecode(hexEncode(s))).toEqual(s);
      });
    });
  });
}