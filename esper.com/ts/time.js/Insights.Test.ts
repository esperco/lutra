/*
  Client-side time stat calculations
*/

/// <reference path="./EventStats.ts" />

module Esper.Insights {
  describe("Insights", function() {
    describe("matchScenario", function() {
      it("should match scenarios where data is all none", function() {
        let ret = matchScenario({
          // Empty map + annotations not accurate, but shouldn't matter if
          // we're looking at total values
          annotations: [],
          eventMap: {},
          totalValue: 100,
          totalUnique: 100,
          some: {},
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 100,
            totalUnique: 100
          }
        }, {
          allNone: () => "none"
        }, function() { return "fallback"; });

        expect(ret).toEqual("none");
      });

      it("should match scenarios where some data is all one key", function() {
        let ret = matchScenario({
          annotations: [],
          eventMap: {},
          totalValue: 100,
          totalUnique: 100,
          some: {
            "bob": {
              annotations: [],
              eventMap: {},
              totalValue: 50,
              totalUnique: 50,
              subgroups: {}
            },
            "other": {
              annotations: [],
              eventMap: {},
              totalValue: 0,
              totalUnique: 0,
              subgroups: {}
            }
          },
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 50,
            totalUnique: 50
          }
        }, {
          allOne: (value) => value
        }, function() { return "fallback"; });

        expect(ret).toEqual("bob");
      });

      it("should match scenarios where all keys are roughly equal",
      function() {
        let ret = matchScenario({
          annotations: [],
          eventMap: {},
          totalValue: 150,
          totalUnique: 150,
          some: {
            "bob": {
              annotations: [],
              eventMap: {},
              totalValue: 32,
              totalUnique: 32,
              subgroups: {}
            },
            "joe": {
              annotations: [],
              eventMap: {},
              totalValue: 33,
              totalUnique: 33,
              subgroups: {}
            },
            "sam": {
              annotations: [],
              eventMap: {},
              totalValue: 34,
              totalUnique: 34,
              subgroups: {}
            }
          },
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 50,
            totalUnique: 50
          }
        }, {
          allEqual: (pairs) => "equal " + _.map(pairs, (p) => p[0]).join(",")
        }, function() { return "fallback"; });

        expect(ret).toEqual("equal sam,joe,bob");
      });

      it("should not match scenarios where all keys are not equal to allEqual",
      function() {
        let ret = matchScenario({
          annotations: [],
          eventMap: {},
          totalValue: 250,
          totalUnique: 250,
          some: {
            "bob": {
              annotations: [],
              eventMap: {},
              totalValue: 50,
              totalUnique: 50,
              subgroups: {}
            },
            "joe": {
              annotations: [],
              eventMap: {},
              totalValue: 50,
              totalUnique: 50,
              subgroups: {}
            },
            "sam": {
              annotations: [],
              eventMap: {},
              totalValue: 100,
              totalUnique: 100,
              subgroups: {}
            }
          },
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 50,
            totalUnique: 50
          }
        }, {
          allEqual: (pairs) => "equal"
        }, function() { return "fallback"; });

        expect(ret).toEqual("fallback");
      });

      it("should match scenarios where tier1 is a majority and also " +
         "return tier2", function() {
        let listKeys = (pairs: [string, number][]) => {
          return _.map(pairs, (p) => p[0]).join(",");
        }
        let ret = matchScenario({
          annotations: [],
          eventMap: {},
          totalValue: 150,
          totalUnique: 150,
          some: {
            "bob": {
              annotations: [],
              eventMap: {},
              totalValue: 40,
              totalUnique: 40,
              subgroups: {}
            },
            "joe": {
              annotations: [],
              eventMap: {},
              totalValue: 39,
              totalUnique: 39,
              subgroups: {}
            },
            "sam": {
              annotations: [],
              eventMap: {},
              totalValue: 21,
              totalUnique: 21,
              subgroups: {}
            }
          },
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 50,
            totalUnique: 50
          }
        }, {
          tiersMajority: (t1, t2) => `m ${listKeys(t1)} ${listKeys(t2)}`,
          tiersPlurality: (t1, t2) => `p ${listKeys(t1)} ${listKeys(t2)}`,
        }, function() { return "fallback"; });

        expect(ret).toEqual("m bob,joe sam");
      });

      it("should match scenarios where tier1 is a plurality and also " +
         "return tier2", function() {
        let listKeys = (pairs: [string, number][]) => {
          return _.map(pairs, (p) => p[0]).join(",");
        }
        let ret = matchScenario({
          annotations: [],
          eventMap: {},
          totalValue: 150,
          totalUnique: 150,
          some: {
            "bob": {
              annotations: [],
              eventMap: {},
              totalValue: 25,
              totalUnique: 25,
              subgroups: {}
            },
            "joe": {
              annotations: [],
              eventMap: {},
              totalValue: 24,
              totalUnique: 24,
              subgroups: {}
            },
            "sam": {
              annotations: [],
              eventMap: {},
              totalValue: 18,
              totalUnique: 18,
              subgroups: {}
            },
            "frank": {
              annotations: [],
              eventMap: {},
              totalValue: 17,
              totalUnique: 17,
              subgroups: {}
            },
            "al": {
              annotations: [],
              eventMap: {},
              totalValue: 16,
              totalUnique: 16,
              subgroups: {}
            }
          },
          none: {
            annotations: [],
            eventMap: {},
            totalValue: 50,
            totalUnique: 50
          }
        }, {
          tiersMajority: (t1, t2) => `m ${listKeys(t1)} ${listKeys(t2)}`,
          tiersPlurality: (t1, t2) => `p ${listKeys(t1)} ${listKeys(t2)}`,
        }, function() { return "fallback"; });

        expect(ret).toEqual("p bob,joe sam,frank,al");
      });
    });
  });
}
