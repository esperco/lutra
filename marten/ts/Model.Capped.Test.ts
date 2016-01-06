/* Test Capped module */

/// <reference path="./Model.Capped.ts"/>

module Esper.Model {

  // A simple model
  interface Rabbit {
    uid: string;
    chubby?: boolean;
  };

  // Create singleton instance of a store of rabbits
  class CappedRabbitStore extends CappedStore<Rabbit> {}
  var rabbitHat = new CappedRabbitStore(3);

  describe("Model.CappedStore", function() {
    beforeEach(function() {
      rabbitHat.reset();
    });

    it("should have a cap", function() {
      expect(rabbitHat.cap).toEqual(3);
    });

    describe("with just enough objects", function() {
      beforeEach(function() {
        _.times(3, function(n) {
          var _id = "rabbit_" + n;
          rabbitHat.insert(_id, { uid: _id });
        });
      });

      it("should preserve all objects", function() {
        expect(rabbitHat.has("rabbit_0")).toBe(true);
        expect(rabbitHat.has("rabbit_1")).toBe(true);
        expect(rabbitHat.has("rabbit_2")).toBe(true);
      });

      describe("with one extra object", function() {
        beforeEach(function() {
          rabbitHat.insert("rabbit_3", { uid: "rabbit_3" });
        });

        it("should keep the total number of objects at the cap", function() {
          expect(rabbitHat.getAll().length).toEqual(3);
        });

        it("should remove objects from the cap in FIFO order", function() {
          expect(rabbitHat.has("rabbit_0")).toBe(false);
          expect(rabbitHat.has("rabbit_1")).toBe(true);
          expect(rabbitHat.has("rabbit_2")).toBe(true);
          expect(rabbitHat.has("rabbit_3")).toBe(true);
        });
      });

      describe("with removal before addition", function() {
        beforeEach(function() {
          rabbitHat.remove("rabbit_2");
          rabbitHat.insert("rabbit_3", { uid: "rabbit_3" });
        });

        it("should not trigger cap", function() {
          expect(rabbitHat.has("rabbit_0")).toBe(true);
          expect(rabbitHat.has("rabbit_1")).toBe(true);
          expect(rabbitHat.has("rabbit_2")).toBe(false);
          expect(rabbitHat.has("rabbit_3")).toBe(true);
        });
      });

      describe("followed by update", function() {
        beforeEach(function() {
          rabbitHat.update("rabbit_0", { uid: "rabbit_0", chubby: true });
        });

        it("should not trigger cap", function() {
          expect(rabbitHat.has("rabbit_0")).toBe(true);
          expect(rabbitHat.has("rabbit_1")).toBe(true);
          expect(rabbitHat.has("rabbit_2")).toBe(true);
        });

        describe("followed by insertion", function() {
          beforeEach(function() {
            rabbitHat.insert("rabbit_3", { uid: "rabbit_3" });
          });

          it("should remove last updated, not last inserted", function() {
            expect(rabbitHat.has("rabbit_0")).toBe(true);
            expect(rabbitHat.has("rabbit_1")).toBe(false);
            expect(rabbitHat.has("rabbit_2")).toBe(true);
            expect(rabbitHat.has("rabbit_3")).toBe(true);
          });
        });
      });

      describe("with aliases", function() {
        beforeEach(function() {
          rabbitHat.alias("rabbit_2", "rabbit_3");
        });

        it("should not count aliases towards cap", function() {
          rabbitHat.upsert("rabbit_3", { uid: "rabbit_3" });
          expect(rabbitHat.has("rabbit_0")).toBe(true);
          expect(rabbitHat.has("rabbit_1")).toBe(true);
          expect(rabbitHat.has("rabbit_2")).toBe(true);
          expect(rabbitHat.has("rabbit_3")).toBe(true);
        });

        it("should count non-aliased towards cap", function() {
          rabbitHat.upsert("rabbit_4", { uid: "rabbit_4" });
          expect(rabbitHat.has("rabbit_0")).toBe(false);
          expect(rabbitHat.has("rabbit_1")).toBe(true);
          expect(rabbitHat.has("rabbit_2")).toBe(true);
          expect(rabbitHat.has("rabbit_3")).toBe(true);
          expect(rabbitHat.has("rabbit_4")).toBe(true);
        });
      });
    });
  });
}