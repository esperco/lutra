/// <reference path="./Model2.Batch.ts"/>

module Esper.Model2 {
  interface Rabbit {
    name: [string, string];
    carrots: number;
  };

  var rabbitStore = new Store<[string, string], Rabbit>();
  var rabbitListStore =
    new BatchStore<number, [string, string], Rabbit>(rabbitStore);

  describe("Model2.BatchStore", function() {
    // IDs
    const rabbitA: [string, string] = ["Rabbit", "A"];
    const rabbitB: [string, string] = ["Rabbit", "B"];
    const rabbitC: [string, string] = ["Rabbit", "C"];

    afterEach(function() {
      rabbitStore.reset();
      rabbitListStore.reset();
    });

    describe("batchSet", function() {
      beforeEach(function() {
        rabbitListStore.batchSet(1, [{
          itemKey: rabbitA,
          data: Option.wrap({ name: rabbitA, carrots: 1 })
        },{
          itemKey: rabbitB,
          data: Option.wrap({ name: rabbitB, carrots: 2 }),
          opts: {
            aliases: [rabbitC]
          }
        }]);
      });

      it("should add data to itemStore",
      function() {
        expect(rabbitStore.get(rabbitA).unwrap().data.unwrap().name)
          .toEqual(rabbitA);
        expect(rabbitStore.get(rabbitB).unwrap().data.unwrap().name)
          .toEqual(rabbitB);
      });

      it("should add opts to itemStore", function() {
        // Alias
        expect(rabbitStore.get(rabbitC).unwrap().data.unwrap().name)
          .toEqual(rabbitB);
      });

      it("should add references to batchStore based on query key", function() {
        expect(rabbitListStore.get(1).unwrap().data.unwrap())
          .toEqual([rabbitA, rabbitB]);
      });

      it("should allow retrieval of item list via batchGet", function() {
        var vals = rabbitListStore.batchGet(1).unwrap();
        expect(vals.length).toEqual(2);
        expect(vals[0].unwrap().data.unwrap().name).toEqual(rabbitA);
        expect(vals[1].unwrap().data.unwrap().name).toEqual(rabbitB);
      });

      describe("if one items in itemStore is missing", function() {
        beforeEach(function() { rabbitStore.remove(rabbitA); });

        it("should have batchGet return none", function() {
          expect(rabbitListStore.batchGet(1).isNone()).toBeTruthy();
        });
      });
    });

    describe("with alias", function() {
      beforeEach(function() {
        rabbitListStore.batchSet(1, [{
          itemKey: rabbitA,
          data: Option.wrap({ name: rabbitA, carrots: 1 })
        },{
          itemKey: rabbitB,
          data: Option.wrap({ name: rabbitB, carrots: 2 }),
          opts: {
            aliases: [rabbitC]
          }
        }], {
          aliases: [2]
        });
      });

      it("should support aliases for queries", function() {
        expect(rabbitListStore.get(2).unwrap().data.unwrap())
          .toEqual([rabbitA, rabbitB]);
      });
    });

    describe("batchFetch", function() {
      var dfd: JQueryDeferred<Option.T<BatchVal<[string, string], Rabbit>[]>>;
      beforeEach(function() {
        dfd = $.Deferred();
        rabbitListStore.batchFetch(2, dfd.promise());
      });

      it("should update batch store dataStatus to FETCHING", function() {
        expect(rabbitListStore.get(2).unwrap().dataStatus)
          .toBe(DataStatus.FETCHING);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          rabbitStore.setOpt(rabbitA, {
            dataStatus: DataStatus.INFLIGHT
          });
          rabbitStore.setOpt(rabbitB, {
            dataStatus: DataStatus.FETCHING
          });
          rabbitStore.setOpt(rabbitC, {
            dataStatus: DataStatus.UNSAVED
          });

          dfd.resolve(Option.some([{
            itemKey: rabbitA,
            data: Option.wrap({ name: rabbitA, carrots: 1 })
          }, {
            itemKey: rabbitB,
            data: Option.wrap({ name: rabbitB, carrots: 2 })
          }, {
            itemKey: rabbitC,
            data: Option.wrap({ name: rabbitC, carrots: 3 })
          }]));
        });

        it("should update batch store dataStatus to READY", function() {
          expect(rabbitListStore.get(2).unwrap().dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should update batch store id list", function() {
          expect(rabbitListStore.get(2).unwrap().data.unwrap())
            .toEqual([rabbitA, rabbitB, rabbitC]);
        });

        it("should update item stores generally speaking", function() {
          var val = rabbitStore.get(rabbitB).unwrap();
          expect(val.data.unwrap().carrots).toEqual(2);
          expect(val.dataStatus).toBe(DataStatus.READY);
        });

        it("should not update an item store if its dataStatus is INFLIGHT",
        function() {
          expect(rabbitStore.get(rabbitA).unwrap().data.isNone()).toBeTruthy();
          expect(rabbitStore.get(rabbitA).unwrap().dataStatus)
            .toBe(DataStatus.INFLIGHT);
        });

        it("should not update an item store if its dataStatus is UNSAVED",
        function() {
          expect(rabbitStore.get(rabbitC).unwrap().data.isNone()).toBeTruthy();
          expect(rabbitStore.get(rabbitC).unwrap().dataStatus)
            .toBe(DataStatus.UNSAVED);
        });
      });

      describe("after promise rejects", function() {
        beforeEach(function() {
          this.err = new Error("Yikes!");
          dfd.reject(this.err);
        });

        it("should update batch store dataStatus to FETCH_ERROR and set " +
           "lastError", function() {
          var val = rabbitListStore.get(2).unwrap()
          expect(val.dataStatus).toBe(DataStatus.FETCH_ERROR);
          expect(val.lastError).toBe(this.err);
        });
      });
    });
  });
}


