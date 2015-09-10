/* Tests for Delta streams */

/// <reference path="./Model.ts"/>
/// <reference path="./Delta.ts"/>

module Esper.Delta {

  // A simple model and store
  interface Rabbit {
    uid: string;
    chubby?: boolean;
  };
  class RabbitStore extends Model.Store<Rabbit> {}

  // Instantiate two instances to keep in sync
  var myRabbits = new RabbitStore();
  var yourRabbits = new RabbitStore();

  describe("Delta.SyncWrap", function() {
    beforeEach(function() {
      myRabbits.reset();
      yourRabbits.reset();

      // Reset change listener (this should happen before re-instantiating
      // SyncWraps, which add listeners)
      yourRabbits.removeAllChangeListeners();
      this.listener = jasmine.createSpy("listener");
      yourRabbits.addChangeListener(this.listener);

      // Instantiate a delta object that gets updated when myRabbits is
      // updated. Delta pub has a limited cap.
      this.deltaPub = new SyncWrap(myRabbits, 3);

      // Wrapper around store to parse delta pubs
      this.deltaSub = new SyncWrap(yourRabbits, 3);
    });

    describe("after serializing and parsing inserts", function() {
      beforeEach(function() {
        myRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        myRabbits.insert("rabbit_1", { uid: "rabbit_1" });
        this.serialized = this.deltaPub.serialize();
        this.deltaSub.parse(this.serialized);
      });

      it("updates the wrapped store", function() {
        expect(yourRabbits.has("rabbit_0")).toBe(true);
        expect(yourRabbits.has("rabbit_1")).toBe(true);
        expect(this.listener.calls.count()).toEqual(2);
      });

      describe("twice", function() {
        beforeEach(function() {
          this.listener.calls.reset();
          this.deltaSub.parse(this.serialized);
        });

        it("only emits an event once for each updated key", function() {
          expect(this.listener.calls.count()).toEqual(0);
        });
      });

      describe("re-serialization by receiving SyncWrap", function() {
        beforeEach(function() {
          this.serialized2 = this.deltaSub.serialize();
          jasmine.addCustomEqualityTester(_.isEqual);
        });

        it("should use the same update _ids as the previous serialization",
        function() {
          var serialized1 = _.map(this.serialized,
            function(tuple) { return (<any> tuple)[0]; });
          var serialized2 = _.map(this.serialized2,
            function(tuple) { return (<any> tuple)[0]; });
          expect(serialized1).toEqual(serialized2);
        });
      });
    });

    describe("after parsing more serialized inserts than cap", function() {
      beforeEach(function() {
        myRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        myRabbits.insert("rabbit_1", { uid: "rabbit_1" });
        myRabbits.insert("rabbit_2", { uid: "rabbit_2" });
        myRabbits.insert("rabbit_3", { uid: "rabbit_3" });
        this.serialized = this.deltaPub.serialize();
        this.deltaSub.parse(this.serialized);
      });

      it("only updates the last X=cap updates", function() {
        expect(yourRabbits.has("rabbit_0")).toBe(false);
        expect(yourRabbits.has("rabbit_1")).toBe(true);
        expect(yourRabbits.has("rabbit_2")).toBe(true);
        expect(yourRabbits.has("rabbit_3")).toBe(true);
        expect(this.listener.calls.count()).toEqual(3);
      });
    });

    describe("when handling updates to the same store _id", function() {
      beforeEach(function() {
        myRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        myRabbits.insert("rabbit_1", { uid: "rabbit_1" });
        myRabbits.update("rabbit_1", { uid: "rabbit_1", chubby: true });
        myRabbits.insert("rabbit_2", { uid: "rabbit_2" });
        this.serialized = this.deltaPub.serialize();
        this.deltaSub.parse(this.serialized);
      });

      it("consolidates the updates to avoid cap", function() {
        expect(yourRabbits.has("rabbit_0")).toBe(true);
        expect(yourRabbits.get("rabbit_1")[0].chubby).toBe(true);
        expect(yourRabbits.has("rabbit_2")).toBe(true);
      });
    });

    describe("when serializing and parsing removals", function() {
      beforeEach(function() {
        myRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        yourRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        myRabbits.remove("rabbit_0");
        this.serialized = this.deltaPub.serialize();
        this.deltaSub.parse(this.serialized);
      });

      it("parsees deletes", function() {
        expect(yourRabbits.has("rabbit_0")).toBe(false);
      });
    });

    describe("when parsing own serialized updates", function() {
      beforeEach(function() {
        myRabbits.insert("rabbit_0", { uid: "rabbit_0" });
        myRabbits.insert("rabbit_1", { uid: "rabbit_1" });
        myRabbits.insert("rabbit_2", { uid: "rabbit_2" });
        this.listener = jasmine.createSpy("listener");
        myRabbits.addChangeListener(this.listener);
        this.deltaPub.parse(this.deltaPub.serialize());
      });

      it("should not trigger any updates", function() {
        expect(this.listener).not.toHaveBeenCalled();
      });
    });
  });
}
