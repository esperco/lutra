/* Test Model.Store */

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

        it("should call the listener", function() {
          expect(listener).toHaveBeenCalled();
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

      it("should call listener", function() {
        expect(listener).toHaveBeenCalled();
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

  });
}
