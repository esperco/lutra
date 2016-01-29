/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="./Partition.ts" />

module Esper.Partition {
  describe("partitioning", function() {
    interface T extends StatSet {
      count: number,
      duration: number
    }

    describe("partitionById", function() {
      it("should sum up stats for each identifier", function() {
        var perms: Permutation<T>[] = [{
          ids: ["A", "B"],
          stats: {
            count: 2,
            duration: 200
          }
        }, {
          ids: ["A", "B", "C"],
          stats: {
            count: 3,
            duration: 300
          }
        }];
        var statsByLabel = partitionById(perms);

        expect(_.keys(statsByLabel)).toEqual(["A", "B", "C"]);
        expect(statsByLabel["A"]).toEqual({
          count: 5, duration: 500
        });
        expect(statsByLabel["B"]).toEqual({
          count: 5, duration: 500
        });
        expect(statsByLabel["C"]).toEqual({
          count: 3, duration: 300
        });
      });
    });

    describe("valueMap", function() {
      it("should sum up and fill in values for a sequence of numbers",
      function() {
        var statMaps: StatMap<T>[] = [{
          a: { count: 1, duration: 100 },
        }, {
          a: { count: 2, duration: 200 },
          b: { count: 3, duration: 300}
        }, {
          b: { count: 4, duration: 400 },
          c: { count: 5, duration: 500 }
        }, {
          c: { count: 6, duration: 600 },
          a: { count: 7, duration: 700 }
        }];

        var vals = valuesById(statMaps);
        expect(_.keys(vals)).toEqual(["a", "b", "c"]);

        expect(vals["a"]).toEqual({
          count: [1, 2, 0, 7],
          duration: [100, 200, 0, 700]
        });

        expect(vals["b"]).toEqual({
          count: [0, 3, 4, 0],
          duration: [0, 300, 400, 0]
        });

        expect(vals["c"]).toEqual({
          count: [0, 0, 5, 6],
          duration: [0, 0, 500, 600]
        });
      });
    });
  });
}
