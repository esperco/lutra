/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Model.Batch.ts"/>

module Esper.Model {

  // A simple model
  interface Rabbit {
    uid: string;
    carrots?: number;
  };

  var rabbitStore = new CappedStore<Rabbit>();
  var rabbitListStore = new BatchStore(rabbitStore);

  describe("Model.BatchStore", function() {
    beforeEach(function() {
      jasmine.addCustomEqualityTester(_.eq);
      rabbitStore.reset();
      rabbitListStore.reset();

      this.queryId = "rabbit search";
      this.uid1 = "brown rabbit";
      this.uid2 = "black bunny";
      this.uid3 = "white lagomorph";

      this.rabbit1 = {
        uid: this.uid1,
        carrots: 123
      };
      this.rabbit2 = {
        uid: this.uid2,
        carrots: 456
      };
      this.rabbit3 = {
        uid: this.uid3,
        carrots: 789
      };
    });

    describe("batchUpsert", function() {
      beforeEach(function() {
        rabbitListStore.batchUpsert(this.queryId, [
          [ this.uid1, this.rabbit1 ],
          [ this.uid2, this.rabbit2 ],
          [ this.uid3, this.rabbit3 ]
        ]);
      });

      it("should add items to itemStore based on key-value tuples", function() {
        expect(rabbitStore.val(this.uid1).carrots).toEqual(123);
        expect(rabbitStore.val(this.uid2).carrots).toEqual(456);
        expect(rabbitStore.val(this.uid3).carrots).toEqual(789);
      });

      it("should add references to batchStore based on query key", function() {
        expect(rabbitListStore.val(this.queryId))
          .toEqual([this.uid1, this.uid2, this.uid3]);
      });

      it("should set metadata", function() {
        rabbitListStore.batchUpsert(this.queryId, [], {
          dataStatus: DataStatus.FETCHING
        });
        expect(rabbitListStore.metadata(this.queryId).dataStatus)
          .toBe(DataStatus.FETCHING);
      });

      it("should allow retrieval of item list via batchVal", function() {
        expect(rabbitListStore.batchVal(this.queryId))
          .toEqual([this.rabbit1, this.rabbit2, this.rabbit3]);
      });

      it("with different lists should update common items", function() {
        var uid4 = "Usagi Yojimbo";
        var rabbit4 = {
          uid: uid4,
          carrots: 999
        };

        var newRabbit1 = {
          uid: this.uid1,
          carrots: 0
        };

        var queryId2 = "rabbit search 2";
        rabbitListStore.batchUpsert(queryId2, [
          [ this.uid1, newRabbit1 ],
          [ this.uid2, this.rabbit2 ],
          [ this.uid4, rabbit4 ]
        ]);

        expect(rabbitListStore.batchVal(this.queryId))
          .toEqual([newRabbit1, this.rabbit2, this.rabbit3]);
        expect(rabbitListStore.batchVal(queryId2))
          .toEqual([newRabbit1, this.rabbit2, rabbit4]);
      });
    });

    describe("batchFetch", function() {
      beforeEach(function() {
        this.dfd = $.Deferred<[string, Rabbit][]>();
        rabbitListStore.batchFetch(this.queryId, this.dfd.promise());
      });

      it("should update batch store dataStatus to FETCHING", function() {
        expect(rabbitListStore.metadata(this.queryId).dataStatus)
          .toBe(DataStatus.FETCHING);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          rabbitStore.upsert(this.uid1, null, {
            dataStatus: DataStatus.INFLIGHT
          });
          rabbitStore.upsert(this.uid2, null, {
            dataStatus: DataStatus.FETCHING
          });
          rabbitStore.upsert(this.uid3, null, {
            dataStatus: DataStatus.UNSAVED
          });

          this.dfd.resolve([
            [ this.uid1, this.rabbit1 ],
            [ this.uid2, this.rabbit2 ],
            [ this.uid3, this.rabbit3 ]
          ]);
        });

        it("should update batch store dataStatus to READY", function() {
          expect(rabbitListStore.metadata(this.queryId).dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should udpate batch store id list", function() {
          expect(rabbitListStore.val(this.queryId))
            .toEqual([this.uid1, this.uid2, this.uid3]);
        });

        it("should update item stores generally speaking", function() {
          expect(rabbitStore.val(this.uid2)).toEqual(this.rabbit2);
          expect(rabbitStore.metadata(this.uid2).dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should not update an item store if its dataStatus is UNSAVED " +
           "or INFLIGHT", function() {
          expect(rabbitStore.val(this.uid1)).toBe(null);
          expect(rabbitStore.metadata(this.uid1).dataStatus)
            .toBe(DataStatus.INFLIGHT);

          expect(rabbitStore.val(this.uid3)).toBe(null);
          expect(rabbitStore.metadata(this.uid3).dataStatus)
            .toBe(DataStatus.UNSAVED);
        });
      });

      describe("after promise rejects", function() {
        beforeEach(function() {
          this.err = new Error("Yikes!");
          this.dfd.reject(this.err);
        });

        it("should update batch store dataStatus to FETCH_ERROR and set " +
           "lastError", function() {
          var metadata = rabbitListStore.metadata(this.queryId);
          expect(metadata.dataStatus).toBe(DataStatus.FETCH_ERROR);
          expect(metadata.lastError).toBe(this.err);
        });
      });
    });
  });
}