/* Test StoreOne module */

/// <reference path="./Model.StoreOne.ts"/>

module Esper.Model {

  // A simple model
  interface Rabbit {
    carrots: number;
  };

  class RabbitStore extends StoreOne<Rabbit> { }
  var myRabbitStore = new RabbitStore();


  describe("Model.StoreOne", function() {

    // Not crypto-secure, but just for testing
    var getRandInt = function() {
      return Math.round(Math.random() * 1000000);
    };

    // Track var between tests
    var carrots: number;
    var baseTime = new Date(2015, 08, 26, 1, 1, 7);

    // Track spies
    var listener: jasmine.Spy;

    // Helpers
    var reset = function() {
      myRabbitStore.reset();
      myRabbitStore.removeAllChangeListeners();
      if (listener) {
        listener.calls.reset();
      }
      jasmine.clock().mockDate(baseTime);
    };

    var setRabbit = function() {
      myRabbitStore.set({
        carrots: (carrots = getRandInt())
      });
    };


    /////////////

    beforeAll(function() {
      jasmine.clock().install();
    });

    afterAll(function() {
      jasmine.clock().uninstall();
    });

    describe("Set with data only", function() {
      beforeAll(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        setRabbit();
      });

      it("should allow us to get set object", function() {
        expect(myRabbitStore.get()[0].carrots).toEqual(carrots);
      });

      it("should make isSet = true", function() {
        expect(myRabbitStore.isSet()).toBe(true);
      });

      it("should allow us to get metadata", function() {
        var metadata = myRabbitStore.get()[1];
        expect(metadata.dataStatus).toBe(DataStatus.READY);
        expect(metadata.lastUpdate).toEqual(baseTime);
      });

      it("should call the listener with the _id", function() {
        expect(listener).toHaveBeenCalled();
      });
    });

    describe("Set with data + metadata", function() {
      beforeAll(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        myRabbitStore.set({
          carrots: (carrots = getRandInt())
        }, {
          dataStatus: DataStatus.INFLIGHT
        });
      });

      it("should still set object correctly", function() {
        expect(myRabbitStore.get()[0].carrots).toEqual(carrots);
      });

      it("should set metadata appropriately", function() {
        var metadata = myRabbitStore.get()[1];
        expect(metadata.dataStatus).toBe(DataStatus.INFLIGHT);
      });
    });

    describe("Set with function", function() {
      beforeAll(function() {
        reset();
        setRabbit();
        this.oldRabbit = myRabbitStore.get();
        this.updateFn = jasmine.createSpy('updateFn').and.returnValue({
          carrots: (carrots = getRandInt())
        });
        myRabbitStore.set(this.updateFn);
      });

      it("should update the object", function() {
        expect(myRabbitStore.get()[0].carrots).toEqual(carrots);
      });

      it("should call the function with old data, metadata", function() {
        expect(this.updateFn).toHaveBeenCalledWith(
          this.oldRabbit[0], this.oldRabbit[1]);
      });
    });

    describe("Unset", function() {
      beforeAll(function() {
        reset();
        setRabbit();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        myRabbitStore.unset();
      });

      it("should not return anything with get", function() {
        expect(myRabbitStore.get()).toBeUndefined();
      });

      it("should make isSet = false", function() {
        expect(myRabbitStore.isSet()).toBe(false);
      });

      it("should call the listener", function() {
        expect(listener).toHaveBeenCalled();
      });
    });

    describe("Subsequent set", function() {
      beforeAll(function() {
        reset();
        setRabbit();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        jasmine.clock().tick(50);
        setRabbit();
      });

      it("should update data", function() {
        expect(myRabbitStore.get()[0].carrots).toEqual(carrots);
      });

      it("should update metadata", function() {
        var metadata = myRabbitStore.get()[1];
        expect(myRabbitStore.get()[1].lastUpdate.getTime())
          .toEqual(baseTime.getTime() + 50);
      });

      it("should call the listener with the _id", function() {
        expect(listener).toHaveBeenCalled();
      });
    });
  });
}