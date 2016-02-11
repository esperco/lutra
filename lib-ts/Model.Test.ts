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
        jasmine.addCustomEqualityTester(_.isEqual);
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

      it("should add to the _id list for our change listener (alias key)",
        function()
      {
        var spy = jasmine.createSpy("change");
        myRabbitStore.addChangeListener(spy);
        myRabbitStore.upsert("brownBunnyId", {uid: "brownBunnyId",
          carrots: 123});
        expect(spy).toHaveBeenCalledWith(["brownRabbitId", "brownBunnyId"]);
      });

      it("should add to the _id list for our change listener (orig key)",
        function()
      {
        var spy = jasmine.createSpy("change");
        myRabbitStore.addChangeListener(spy);
        myRabbitStore.upsert("brownRabbitId", {uid: "brownBunnyId",
          carrots: 123});
        expect(spy).toHaveBeenCalledWith(["brownRabbitId", "brownBunnyId"]);
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

    describe("push", function() {
      beforeEach(function() {
        reset();
        this.uid = "brownRabbitId";
        this.dfd = $.Deferred<Rabbit>();
      });

      it("should set an initial value if one is passed", function() {
        myRabbitStore.push(this.uid, this.dfd.promise(), {
          uid: this.uid, carrots: 123
        });
        expect(myRabbitStore.val(this.uid).carrots).toEqual(123);
      });

      it("should not override existing data if no value is passed", function() {
        myRabbitStore.insert(this.uid, {
          uid: this.uid,
          carrots: 456
        });
        myRabbitStore.push(this.uid, this.dfd.promise());
        expect(myRabbitStore.val(this.uid).carrots).toEqual(456);
      });

      it("should normally update dataStatus to INFLIGHT", function() {
        myRabbitStore.push(this.uid, this.dfd, {
          uid: this.uid, carrots: 123
        });
        expect(myRabbitStore.metadata(this.uid).dataStatus)
          .toBe(DataStatus.INFLIGHT);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          myRabbitStore.insert(this.uid, {
            uid: this.uid,
            carrots: 456
          });
          myRabbitStore.push(this.uid, this.dfd.promise());
          this.dfd.resolve({
            uid: this.uid,
            carrots: 789
          });
        });

        it("should update the store metadata to READY", function() {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should not update store value", function() {
          expect(myRabbitStore.val(this.uid).carrots).toBe(456);
        });
      });

      describe("after promise fails", function() {
        beforeEach(function() {
          myRabbitStore.push(this.uid, this.dfd.promise());
          this.err = new Error("Whoops!");
          this.dfd.reject(this.err);
        });

        it("should update dataStatus to PUSH_ERROR and populate lastError",
          function() {
            var metadata = myRabbitStore.metadata(this.uid);
            expect(metadata.dataStatus).toBe(DataStatus.PUSH_ERROR);
            expect(metadata.lastError).toBe(this.err);
          });
      });

      describe("if data at key is UNSAVED after fetch initiated", function() {
        beforeEach(function() {
          myRabbitStore.push(this.uid, this.dfd, {
            uid: this.uid, carrots: 123
          });
          myRabbitStore.update(this.uid, {
            uid: this.uid,
            carrots: 456
          }, {
            dataStatus: DataStatus.UNSAVED
          });
          this.dfd.resolve();
        });

        it("should not update dataStatus to READY after resolution",
          function()
        {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.UNSAVED);
        });
      });
    });

    describe("fetch", function() {
      beforeEach(function() {
        reset();
        this.uid = "brownRabbitId";
        this.dfd = $.Deferred<Rabbit>();
      });

      describe("default", function() {
        beforeEach(function() {
          myRabbitStore.fetch(this.uid, this.dfd.promise());
        });

        it("should normally update dataStatus to FETCHING", function() {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.FETCHING);
        });

        it("should update value and dataStatus to READY after promise resolves",
          function()
        {
          this.dfd.resolve({
            uid: this.uid, carrots: 789
          });

          var data = myRabbitStore.val(this.uid);
          expect(data.carrots).toBe(789);

          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.READY);
        });

        it("should update dataStatus to FETCH_ERROR after promise rejects",
          function()
        {
          this.err = new Error("Boom");
          this.dfd.reject(this.err);

          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.FETCH_ERROR);
        });
      });

      describe("if data at key is currently UNSAVED", function() {
        beforeEach(function() {
          myRabbitStore.insert({
            uid: this.uid,
            carrots: 456
          }, {
            _id: this.uid,
            dataStatus: DataStatus.UNSAVED
          });
          myRabbitStore.fetch(this.uid, this.dfd);
        });

        it("should not update dataStatus initially", function() {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.UNSAVED);
        });

        it("should not update dataStatus after promise resolves",
          function()
        {
          this.dfd.resolve(null);
          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.UNSAVED);
        });

        it("should not update dataStatus after promise rejects",
          function()
        {
          this.err = new Error("Boom");
          this.dfd.reject(this.err);
          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.UNSAVED);
        });
      });

      describe("if data at key is currently INFLIGHT", function() {
        beforeEach(function() {
          myRabbitStore.insert({
            uid: this.uid,
            carrots: 456
          }, {
            _id: this.uid,
            dataStatus: DataStatus.INFLIGHT
          });
          myRabbitStore.fetch(this.uid, this.dfd);
        });

        it("should not update dataStatus initially", function() {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.INFLIGHT);
        });

        it("should not update dataStatus after promise resolves",
          function()
        {
          this.dfd.resolve(null);
          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.INFLIGHT);
        });

        it("should not update dataStatus after promise rejects",
          function()
        {
          this.err = new Error("Boom");
          this.dfd.reject(this.err);
          var metadata = myRabbitStore.metadata(this.uid);
          expect(metadata.dataStatus).toBe(DataStatus.INFLIGHT);
        });
      });
    });

    describe("pushFetch", function() {
      beforeEach(function() {
        reset();
        this.uid = "brownRabbitId";
        this.dfd = $.Deferred<Rabbit>();
        myRabbitStore.pushFetch(this.uid, this.dfd.promise(), {
          uid: this.uid,
          carrots: 123
        });
      });

      it("should update with initial value", function() {
        expect(myRabbitStore.val(this.uid).carrots).toEqual(123);
      });

      it("should set status to INFLIGHT", function() {
        expect(myRabbitStore.metadata(this.uid).dataStatus)
          .toBe(DataStatus.INFLIGHT);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          this.dfd.resolve({
            uid: this.uid,
            carrots: 789
          });
        });

        it("should update the store metadata to READY", function() {
          expect(myRabbitStore.metadata(this.uid).dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should update store value", function() {
          expect(myRabbitStore.val(this.uid).carrots).toBe(789);
        });
      });

      describe("after promise fails", function() {
        beforeEach(function() {
          myRabbitStore.push(this.uid, this.dfd.promise());
          this.err = new Error("Whoops!");
          this.dfd.reject(this.err);
        });

        it("should update dataStatus to PUSH_ERROR and populate lastError",
          function() {
            var metadata = myRabbitStore.metadata(this.uid);
            expect(metadata.dataStatus).toBe(DataStatus.PUSH_ERROR);
            expect(metadata.lastError).toBe(this.err);
          });
      });
    });

    describe("isTuple", function() {
      it("should return true for data, metadata pair", function() {
        expect(myRabbitStore.isTuple([{
          uid: "rabbit",
          carrots: 123
        }, {
          dataStatus: Model.DataStatus.READY
        }])).toBe(true);
      });

      it("should return false if just data", function() {
        expect(myRabbitStore.isTuple({
          uid: "rabbit",
          carrots: 123
        })).toBe(false);
      });

      it("should return false if metadata has extra values", function() {
        var metadataPlus = (<StoreMetadata> {
          dataStatus: Model.DataStatus.READY,
          extraVal: 123
        });
        expect(myRabbitStore.isTuple([{
          uid: "rabbit",
          carrots: 123
        }, metadataPlus])).toBe(false);
      });
    });


    ///////

    describe("track", function() {
      beforeEach(function() {
        reset();
        this.post = jasmine.createSpy("post");
      });

      it("should return the value of its callback", function() {
        expect(track(() => 123, this.post)).toBe(123);
      });

      it("should call the post function with any store and values tracked",
        function()
      {
        track(() => {
          myRabbitStore.has("brown_rabbit");
          myRabbitStore.get("black_rabbit");
        }, this.post);

        expect(this.post).toHaveBeenCalledWith([{
          store: myRabbitStore,
          key: "brown_rabbit"
        }, {
          store: myRabbitStore,
          key: "black_rabbit"
        }]);
      });

      it("should track getAll calls", function() {
        track(() => {
          myRabbitStore.getAll();
        }, this.post);

        expect(this.post).toHaveBeenCalledWith([{
          store: myRabbitStore,
        }]);
      });
    });


    ///////

    describe("transact", function() {
      beforeEach(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);
      });

      it("should call listener only once per update", function() {
        myRabbitStore.transact(function() {
          myRabbitStore.insert("brown", {
            uid: "brown",
            carrots: 123
          });

          myRabbitStore.insert("black", {
            uid: "black",
            carrots: 123
          });
        });

        expect(listener).toHaveBeenCalledWith(["brown", "black"]);
        expect(listener.calls.count()).toEqual(1);
      });

      it("should call listener only once per update even when nested",
        function()
      {
        myRabbitStore.transact(function() {
          myRabbitStore.insert("brown", {
            uid: "brown",
            carrots: 123
          });

          myRabbitStore.transact(function() {
            myRabbitStore.insert("black", {
              uid: "black",
              carrots: 123
            });
          });
        });

        expect(listener).toHaveBeenCalledWith(["brown", "black"]);
        expect(listener.calls.count()).toEqual(1);
      });

      it("should reset between transactions", function() {
        myRabbitStore.transact(function() {
          myRabbitStore.insert("brown", {
            uid: "brown",
            carrots: 123
          });
        });

        myRabbitStore.transact(function() {
          myRabbitStore.insert("black", {
            uid: "black",
            carrots: 123
          });
        });

        expect(listener).toHaveBeenCalledWith(["brown"]);
        expect(listener).toHaveBeenCalledWith(["black"]);
        expect(listener.calls.count()).toEqual(2);
      });
    });

    describe("transactP", function() {
      beforeEach(function() {
        reset();
        listener = jasmine.createSpy("listener");
        myRabbitStore.addChangeListener(listener);

        this.dfd = $.Deferred<any>();
        this.promise = this.dfd.promise();
      });

      it("should call listener only once per promise resolution", function() {
        myRabbitStore.transactP(this.promise, function(p) {
          p.done(function() {
            myRabbitStore.insert("brown", {
              uid: "brown",
              carrots: 123
            });
          });

          p.done(function() {
            myRabbitStore.insert("black", {
              uid: "black",
              carrots: 123
            });
          });
        });
        this.dfd.resolve();

        expect(listener).toHaveBeenCalledWith(["brown", "black"]);
        expect(listener.calls.count()).toEqual(1);
      });

       it("should call listener only once per promise rejection", function() {
        myRabbitStore.transactP(this.promise, function(p) {
          p.fail(function() {
            myRabbitStore.insert("brown", {
              uid: "brown",
              carrots: 123
            });
          });

          p.fail(function() {
            myRabbitStore.insert("black", {
              uid: "black",
              carrots: 123
            });
          });
        });
        this.dfd.reject();

        expect(listener).toHaveBeenCalledWith(["brown", "black"]);
        expect(listener.calls.count()).toEqual(1);
      });

      it("should call listener only once per promise even when nested",
        function()
      {
        myRabbitStore.transactP(this.promise, function(p) {
          p.done(function() {
            myRabbitStore.insert("brown", {
              uid: "brown",
              carrots: 123
            });
          });

          myRabbitStore.transactP(p, function(p2) {
            p2.done(function() {
              myRabbitStore.insert("black", {
                uid: "black",
                carrots: 123
              });
            });
          });
        });
        this.dfd.resolve();

        expect(listener).toHaveBeenCalledWith(["brown", "black"]);
        expect(listener.calls.count()).toEqual(1);
      });

      it("should reset between transactions", function() {
        myRabbitStore.transactP(this.promise, function(p) {
          p.done(function() {
            myRabbitStore.insert("brown", {
              uid: "brown",
              carrots: 123
            });
          });
        });

        myRabbitStore.transactP(this.promise, function(p) {
          p.done(function() {
            myRabbitStore.insert("black", {
              uid: "black",
              carrots: 123
            });
          });
        });

        this.dfd.resolve();

        expect(listener).toHaveBeenCalledWith(["brown"]);
        expect(listener).toHaveBeenCalledWith(["black"]);
        expect(listener.calls.count()).toEqual(2);
      });
    });
  });
}
