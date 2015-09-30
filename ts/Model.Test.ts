/* Test Model.Store */

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Model.ts"/>
module Esper.Model {

  // Set up a sample Flux store for testing ///////////////////

  class Rabbit {
    uid: string;
    carrots: number;
  };

  // Create singleton instance of a store of rabbits
  class RabbitStore extends Store<Rabbit> {}
  var myRabbitStore = new RabbitStore();

  describe("Model.Store", function() {

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

    var insertBrownRabbit = function() {
      myRabbitStore.insert("brownRabbitId", {
        uid: "brownRabbitId",
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

      it("should allow us to get only the value by _id", function() {
        expect(myRabbitStore.val("brownRabbitId").carrots).toEqual(carrots);
      });

      it("should allow us to get metadata", function() {
        var metadata = myRabbitStore.get("brownRabbitId")[1];
        expect(metadata._id).toBe("brownRabbitId");
        expect(metadata.dataStatus).toBe(DataStatus.READY);
        expect(metadata.lastUpdate).toEqual(baseTime);
      });

      it("should allow us to get only the metadata by _id", function() {
        var metadata = myRabbitStore.metadata("brownRabbitId");
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

      it("should call the listener with the _id", function() {
        expect(listener).toHaveBeenCalledWith(["brownRabbitId"]);
      });
    });

    describe("Insert multiple", function() {
      beforeAll(function() {
        reset();
        myRabbitStore.insert("albinoRabbitId", {
          uid: "albinoRabbitId", carrots: 2
        });
        myRabbitStore.insert("brownRabbitId", {
          uid: "brownRabbitId", carrots: 1
        });
        jasmine.addCustomEqualityTester(_.eq);
      });

      it("should let us get all inserted data", function() {
        var rabbits = myRabbitStore.getAll();
        var rabbitIds = _.map(rabbits, function(r) { return r[0].uid; }).sort();
        expect(rabbitIds).toEqual(["albinoRabbitId", "brownRabbitId"]);
      });

      it("should let us get all inserted metadata", function() {
        var rabbits = myRabbitStore.getAll();
        var rabbitIds = _.map(rabbits, function(r) { return r[1]._id; }).sort();
        expect(rabbitIds).toEqual(["albinoRabbitId", "brownRabbitId"]);
      });

      it("should let us get all inserted data only", function() {
        var rabbits = myRabbitStore.valAll();
        var rabbitIds = _.map(rabbits, function(r) { return r.uid; }).sort();
        expect(rabbitIds).toEqual(["albinoRabbitId", "brownRabbitId"]);
      });
    });

    describe("Insert with explicit metadata", function() {
      beforeAll(function() {
        reset();
        myRabbitStore.insert({
          uid: "brownRabbitId",
          carrots: (carrots = getRandInt())
        }, {
          _id: "brownRabbitId",
          dataStatus: DataStatus.INFLIGHT
        });
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

    describe("Update without prior insert",
      function() {
        beforeAll(reset);

        it("should fail", function() {
          expect(function() {
            myRabbitStore.update("brownRabbitId", {
              uid: "brownRabbitId",
              carrots: 12345
            });
          }).toThrow();
        });
      }
    );

    describe("Upsert without prior insert",
      function() {
        beforeAll(function() {
          reset();
          listener = jasmine.createSpy("listener");
          myRabbitStore.addChangeListener(listener);
          myRabbitStore.upsert("brownRabbitId", {
            uid: "brownRabbitId",
            carrots: (carrots = getRandInt())
          });
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

        it("should call the listener with the _id", function() {
          expect(listener).toHaveBeenCalledWith(["brownRabbitId"]);
        });
      }
    );

    describe("Update with prior insert", function() {
      beforeEach(function() {
        reset();
        insertBrownRabbit();
      });

      describe("with object", function() {
        beforeEach(function() {
          listener = jasmine.createSpy("listener");
          myRabbitStore.addChangeListener(listener);
          myRabbitStore.update("brownRabbitId", {
            uid: "brownRabbitId",
            carrots: (carrots = getRandInt())
          })
        });

        it("should replace object", function() {
          expect(myRabbitStore.get("brownRabbitId")[0].carrots)
            .toEqual(carrots);
        });

        it("should call the listener with the _id", function() {
          expect(listener).toHaveBeenCalledWith(["brownRabbitId"]);
        });
      });

      describe("with object and metadata", function() {
        beforeEach(function() {
          myRabbitStore.update("brownRabbitId", {
            uid: "brownRabbitId",
            carrots: (carrots = getRandInt())
          }, {
            _id: "brownRabbitId",
            dataStatus: DataStatus.INFLIGHT,
          });
        });

        it("should replace object", function() {
          expect(myRabbitStore.get("brownRabbitId")[0].carrots)
            .toEqual(carrots);
        });

        it("should replace metadata", function() {
          expect(myRabbitStore.get("brownRabbitId")[1].dataStatus)
            .toEqual(DataStatus.INFLIGHT);
        });
      });

      describe("with metadata replacing time", function() {
        beforeEach(function() {
          jasmine.clock().tick(50);
          myRabbitStore.update("brownRabbitId", {
            uid: "brownRabbitId",
            carrots: carrots
          }, {
            _id: "brownRabbitId",
            lastUpdate: new Date(2020, 5, 5)
          });
        });

        it("should ignore provided metadata lastUpdate and use actual time",
          function() {
            expect(myRabbitStore.get("brownRabbitId")[1].lastUpdate.getTime())
              .toEqual(baseTime.getTime() + 50);
          });
      });

      describe("with function", function() {
        beforeEach(function() {
          this.oldRabbit = myRabbitStore.get("brownRabbitId");
          this.updateFn = jasmine.createSpy('updateFn').and.returnValue({
            uid: "brownRabbitId",
            carrots: (carrots = getRandInt())
          });
          myRabbitStore.update("brownRabbitId", this.updateFn);
        });

        it("should update the object", function() {
          expect(myRabbitStore.get("brownRabbitId")[0].carrots)
            .toEqual(carrots);
        });

        it("should call the function with old data, metadata", function() {
          expect(this.updateFn).toHaveBeenCalledWith(
            this.oldRabbit[0], this.oldRabbit[1]);
        });
      });

      describe("with function updating metadata", function() {
        beforeEach(function() {
          myRabbitStore.update("brownRabbitId", function() {
            return [{
              uid: "brownRabbitId",
              carrots: (carrots = getRandInt())
            }, {
              _id: "brownRabbitId",
              dataStatus: DataStatus.INFLIGHT
            }];
          });
        });

        it("should update the object", function() {
          expect(myRabbitStore.get("brownRabbitId")[0].carrots)
            .toEqual(carrots);
        });

        it("should update the metadata", function() {
          expect(myRabbitStore.get("brownRabbitId")[1].dataStatus)
            .toEqual(DataStatus.INFLIGHT);
        });
      });

      describe("with function doing mutations", function() {
        beforeEach(function() {
          this.oldRabbit = myRabbitStore.get("brownRabbitId");
          this.oldCarrots = this.oldRabbit[0].carrots;
          myRabbitStore.update("brownRabbitId", function(data, metadata) {
            data.carrots = getRandInt();
            metadata.dataStatus = DataStatus.INFLIGHT;
            return [data, metadata];
          });
        });

        it("should not modify old data", function() {
          expect(this.oldRabbit[0].carrots).toBe(this.oldCarrots);
        });

        it("should not modify old metadata", function() {
          expect(this.oldRabbit[1].dataStatus).toBe(DataStatus.READY);
        });
      });
    });

    describe("Remove existing _id", function() {
      beforeAll(function() {
        reset();
        insertBrownRabbit();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        myRabbitStore.remove("brownRabbitId");
      });

      it("should remove object from store", function() {
        expect(myRabbitStore.get("brownRabbitId")).toBeUndefined();
      });

      it("should call listener with the _id", function() {
        expect(listener).toHaveBeenCalledWith(["brownRabbitId"]);
      });
    });

    describe("Remove non-existent _id", function() {
      beforeAll(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
        myRabbitStore.remove("brownRabbitId");
      });

      it("should not call listener", function() {
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe("Change listeners trying to update existing keys", function() {
      beforeAll(function() {
        reset();
        var called = false;
        myRabbitStore.addChangeListener(function() {
          if (! called) {
            called = true; // To prevent infinite loop
            myRabbitStore.update("brownRabbitId", {
              uid: "brownRabbitId",
              carrots: 12345
            });
          }
        });
      });

      /*
        Store changes that result in further updates to that same store are
        difficult to reason about and can trigger cascading loops, hence
        the error.
      */
      it("should throw a unidirectional flow error", function() {
        expect(insertBrownRabbit).toThrowError(/flow error/);
      });
    });

    describe("Alias", function() {
      beforeAll(function() {
        reset();
        insertBrownRabbit();
        myRabbitStore.alias("brownRabbitId", "brownBunnyId");
      });

      it("should allow retrieval by original _id", function() {
        expect(myRabbitStore.val("brownRabbitId").carrots).toEqual(carrots);
      });

      it("should update the alias metadata", function() {
        var aliasList = myRabbitStore.metadata("brownRabbitId").aliases;
        expect(aliasList).toContain("brownBunnyId");
      });

      it("should allow retrieval by new alias", function() {
        expect(myRabbitStore.val("brownBunnyId").carrots).toEqual(carrots);
      });

      describe("removing by original _id", function() {
        beforeAll(function() {
          myRabbitStore.remove("brownRabbitId");
        });

        it("should remove alias", function() {
          expect(myRabbitStore.has("brownBunnyId")).toBeFalsy();
        });

        it("should allow inserting of new data detached from alias",
          function() {
            myRabbitStore.insert("brownBunnyId", {
              uid: "brownBunnyId",
              carrots: 123
            });
            var retrieved = myRabbitStore.val("brownBunnyId");
            expect(retrieved.uid).toBe("brownBunnyId");
            expect(retrieved.carrots).toBe(123);
            expect(myRabbitStore.has("brownRabbitId")).toBeFalsy();
        });
      });
    });

  });
}
