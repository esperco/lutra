/// <reference path="../lib/Test.ts" />
/// <reference path="./Partition.ts" />

module Esper.Partition {
  describe("partitioning", function() {
    describe("groupByMany", function() {
      var val1: { x: string[] } = {x: ["a", "b"]};
      var val2: { x: string[] } = {x: ["b", "c"]};
      var val3: { x: string[] } = {x: []};
      var val4: { x: string[] } = {x: []};

      function getVal() {
        return groupByMany([val1, val2, val3, val4], (val) => val.x);
      }

      it("should list items by key, with duplicates", function() {
        expect(getVal().some).toEqual([
          { key: "a", items: [val1]},
          { key: "b", items: [val1, val2]},
          { key: "c", items: [val2]}
        ]);
      });

      it("should list items with no keys", function() {
        expect(getVal().none).toEqual([val3, val4]);
      });
    });
  });
}
