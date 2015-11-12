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
      rabbitStore.reset();
      rabbitListStore.reset();
    });

    describe("batchUpsert", function() {
      beforeEach(function() {
        jasmine.addCustomEqualityTester(_.eq);

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
  });
}