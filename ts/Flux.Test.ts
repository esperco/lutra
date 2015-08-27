/* Test Flux module */
module Esper.Flux_ {

  // Set up a sample Flux store for testing ///////////////////

  class Rabbit {
    uid: string;
    carrots: number;
  };

  // Create singleton instance of a store of rabbits
  class RabbitStore extends Store<Rabbit> {}
  var myRabbitStore = new RabbitStore();

  // Export store-related actions and connect them to store
  export class Insert extends InsertAction<Rabbit> {}
  myRabbitStore.handle(Insert);
  export class Update extends UpdateAction<Rabbit> {}
  myRabbitStore.handle(Update);
  export class Remove extends RemoveAction {}
  myRabbitStore.handle(Remove);

  // Connect default RabbitStore actions to dispatcher
  myRabbitStore.register(AppDispatcher);

  describe("Flux_.Store", function() {

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
      jasmine.clock().mockDate(baseTime);
    };

    var insertBrownRabbit = function() {
      AppDispatcher.dispatch(new Insert("brownRabbitId", {
        uid: "brownRabbitId",
        carrots: (carrots = getRandInt())
      }));
    };


    /////////////

    describe("Insert with _id", function() {
      beforeAll(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        insertBrownRabbit();
      });

      it("should allow us to get object by _id", function() {
        expect(myRabbitStore.get("brownRabbitId")[0].carrots)
          .toEqual(carrots);
      });

      it("should allow us to get metadata", function() {
        var metadata = myRabbitStore.get("brownRabbitId")[1];
        expect(metadata._id).toBe("brownRabbitId");
        expect(metadata.dataStatus).toBe(DataStatus.READY);
        expect(metadata.lastUpdate).toEqual(baseTime);
      });

      it("should cause subsequent insert with same _id to fail", function() {
        var oldCarrots = carrots;
        expect(insertBrownRabbit).toThrow();
        expect(myRabbitStore.get("brownRabbitId")[0].carrots)
          .toEqual(oldCarrots);
      });

      it("should call the listener", function() {
        expect(listener).toHaveBeenCalled();
      });
    });

    describe("Insert with explicit metadata", function() {
      beforeAll(function() {
        reset();
        AppDispatcher.dispatch(new Insert({
          uid: "brownRabbitId",
          carrots: (carrots = getRandInt())
        }, {
          _id: "brownRabbitId",
          dataStatus: DataStatus.INFLIGHT
        }));
      });

      it("should allow us to get object by _id", function() {
        expect(myRabbitStore.get("brownRabbitId")[0].carrots)
          .toEqual(carrots);
      });

      it("should allow us to get metadata", function() {
        var metadata = myRabbitStore.get("brownRabbitId")[1];
        expect(metadata._id).toBe("brownRabbitId");
        expect(metadata.dataStatus).toBe(DataStatus.INFLIGHT);
        expect(metadata.lastUpdate).toEqual(baseTime);
      })
    });

    describe("Update without prior insert if upsert var is not specified",
      function() {
        beforeAll(reset);

        it("should fail", function() {
          expect(function() {
            AppDispatcher.dispatch(new Update("brownRabbitId", {
              uid: "brownRabbitId",
              carrots: 12345
            }));
          }).toThrow();
        });
      }
    );

    describe("Update without prior insert if upsert var is specified",
      function() {
        beforeAll(function() {
          reset();
          listener = jasmine.createSpy("listener");
          myRabbitStore.addChangeListener(listener);
          AppDispatcher.dispatch(new Update("brownRabbitId", {
            uid: "brownRabbitId",
            carrots: (carrots = getRandInt())
          }, /* upsert = */ true));
        });

        it("should insert a new object", function() {
          expect(myRabbitStore.get("brownRabbitId")[0].carrots)
            .toEqual(carrots);
        });

        it("should have metadata", function() {
          var metadata = myRabbitStore.get("brownRabbitId")[1];
          expect(metadata._id).toBe("brownRabbitId");
          expect(metadata.dataStatus).toBe(DataStatus.READY);
          expect(metadata.lastUpdate).toEqual(baseTime);
        });

        it("should call the listener", function() {
          expect(listener).toHaveBeenCalled();
        });
      }
    );

    describe("Update with prior insert", function() {
      beforeEach(function() {
        reset();
        insertBrownRabbit();
      });

      xdescribe("with object", function() {
        // beforeEach(function() {

        // });
      });

      xdescribe("with function", function() {

      });
    });

  });
}
