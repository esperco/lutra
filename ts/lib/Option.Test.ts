/// <reference path="./Option.ts"/>
module Esper.Option {
  interface P {
    x: number;
    y: number;
  }

  describe("Option.wrap", function() {
    describe("with a truthy value", function() {
      beforeEach(function() {
        this.option = Option.wrap({x: 5, y: 6});
      });

      it("should match the some function", function() {
        expect(this.option.match({
          none: () => "NONE",
          some: (p: P) => p.x + p.y
        })).toBe(11);
      });

      it("is Some, not None", function() {
        expect(this.option.isNone()).toBe(false);
        expect(this.option.isSome()).toBe(true);
      });

      it("can be unwrapped", function() {
        expect(this.option.unwrap()).toEqual({x: 5, y: 6});
      });

      it("should allow monadic bind via flatMap", function() {
        var mapped = this.option.flatMap((p: P) => Option.wrap(p.x));
        expect(mapped.unwrap()).toEqual(5);
      });

      it("should run the closure given to mapOr", function() {
        var value = this.option.mapOr("NONE", (p: P) => "SOME");
        expect(value).toEqual("SOME");
      })
    });

    describe("with null", function() {
      beforeEach(function() {
        this.option = Option.wrap(null);
      });

      it("should match the none function", function() {
        expect(this.option.match({
          none: () => "NONE",
          some: (p: P) => p.x + p.y
        })).toBe("NONE");
      });

      it("is None, not Some", function() {
        expect(this.option.isNone()).toBe(true);
        expect(this.option.isSome()).toBe(false);
      });

      it("should throw an error when unwrapped", function() {
        expect(function() {
          this.option.unwrap();
        }).toThrowError();
      });

      it("should preserve None state during flatMap", function() {
        var mapped = this.option.flatMap((p: P) => Option.wrap(p.x));
        expect(mapped.isNone()).toBe(true);
      });

      it("should return the fallback value given to mapOr", function() {
        var value = this.option.mapOr("NONE", (p: P) => "SOME");
        expect(value).toEqual("NONE");
      })
    });

    describe("with false", function() {
      beforeEach(function() {
        this.option = Option.wrap(false);
      });

      it("is Some, not None", function() {
        expect(this.option.isNone()).toBe(false);
        expect(this.option.isSome()).toBe(true);
      });
    });

    describe("with undefined", function() {
      beforeEach(function() {
        this.option = Option.wrap(undefined);
      });

      it("is None, not Some", function() {
        expect(this.option.isNone()).toBe(true);
        expect(this.option.isSome()).toBe(false);
      });
    });
  });

  describe("Option.cast", function() {
    describe("with value", function() {
      beforeEach(function() {
        this.option = Option.wrap({x: 5, y: 6});
      });

      it("should work like Option.wrap", function() {
        expect(this.option.unwrap()).toEqual({x: 5, y: 6});
      });
    });

    describe("with existing option", function() {
      beforeEach(function() {
        var first = Option.wrap({x: 5, y: 6});
        this.option = Option.cast(first);
      });

      it("should preserve only one layer of option", function() {
        expect(this.option.unwrap()).toEqual({x: 5, y: 6});
      });
    });
  });

  describe("Option.flatten", function() {
    it("should return a list with unwrapped options that are are not None",
    function() {
      expect(Option.flatten([
        Option.none<number>(),
        Option.some(1),
        Option.none<number>(),
        Option.some(2)
      ])).toEqual([1, 2]);
    });
  });
}
