/*
  Client-side time stat calculations
*/

/// <reference path="./EventStats.ts" />

module Esper.Insights {
  describe("Insights", function() {

    // Helper function for creating calc data
    function makeScenario(
      some: {[index: string]: number} = {},
      none = 0
    ): Types.RangesGroup {
      let someGroups: {[index: string]: Types.RangeSeries} = {};
      _.each(some, (v, k) => {
        someGroups[k] = {
          weights: [],
          events: [],
          eventMap: {},
          totalUnique: v,
          totalValue: v,
          values: []
        };
      });

      let total = _.sum(_.values(some)) + none;

      return {
        // Empty map + weights not accurate, but shouldn't matter if
        // we're looking at total values
        some: someGroups,
        none: {
          weights: [],
          events: [],
          eventMap: {},
          values: [],
          totalValue: none,
          totalUnique: none
        },
        all: {
          weights: [],
          events: [],
          eventMap: {},
          values: [],
          totalValue: total,
          totalUnique: total,
        }
      };
    }

    describe("matchScenario", function() {
      it("should match scenarios where data is all none", function() {
        let ret = matchScenario(
          makeScenario({}, 100),
          {
            allNone: () => "none",
            fallback: () => "fallback"
          });

        expect(ret).toEqual("none");
      });

      it("should match scenarios where some data is all one key", function() {
        let ret = matchScenario(
          makeScenario({"bob": 50, "other": 0}, 50),
          {
            allOne: (value) => value,
            fallback: () => "fallback"
          });

        expect(ret).toEqual("bob");
      });

      it("should match scenarios where all keys are roughly equal",
      function() {
        let ret = matchScenario(
          makeScenario({"bob": 32, "joe": 33, "sam": 34}, 50),
          {
            allEqual: (pairs) => "equal " + _.map(pairs, (p) => p[0]).join(","),
            fallback: () => "fallback"
          });

        expect(ret).toEqual("equal sam,joe,bob");
      });

      it("should not match scenarios where all keys are not equal to allEqual",
      function() {
        let ret = matchScenario(
          makeScenario({"bob": 50, "joe": 50, "sam": 100}, 50),
          {
            allEqual: (pairs) => "equal",
            fallback: () => "fallback"
          });

        expect(ret).toEqual("fallback");
      });

      it("should match scenarios where tier1 is a majority and also " +
         "return tier2", function() {
        let listKeys = (pairs: [string, number][]) => {
          return _.map(pairs, (p) => p[0]).join(",");
        }
        let ret = matchScenario(
          makeScenario({"bob": 40, "joe": 39, "sam": 21}, 50),
          {
            tiersMajority: (t1, t2) => `m ${listKeys(t1)} ${listKeys(t2)}`,
            tiersPlurality: (t1, t2) => `p ${listKeys(t1)} ${listKeys(t2)}`,
            fallback: () => "fallback"
          });

        expect(ret).toEqual("m bob,joe sam");
      });

      it("should match scenarios where tier1 is a plurality and also " +
         "return tier2", function() {
        let listKeys = (pairs: [string, number][]) => {
          return _.map(pairs, (p) => p[0]).join(",");
        }
        let ret = matchScenario(makeScenario(
          {"bob": 25, "joe": 24, "sam": 18, "frank": 17, "al": 16}, 50
        ), {
          tiersMajority: (t1, t2) => `m ${listKeys(t1)} ${listKeys(t2)}`,
          tiersPlurality: (t1, t2) => `p ${listKeys(t1)} ${listKeys(t2)}`,
          fallback: () => "fallback"
        });

        expect(ret).toEqual("p bob,joe sam,frank,al");
      });
    });
  });
}
