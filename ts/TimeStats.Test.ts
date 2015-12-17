/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.TimeStats {

  function getStatEntries(): ApiT.CalendarStatEntry[] {
    return [{
      event_labels: ["A", "B"],
      event_count: 2,
      event_duration: 200
    }, {
      event_labels: ["A", "B", "C"],
      event_count: 3,
      event_duration: 300
    }];
  }

  ////

  describe("TimeStats", function() {

    describe("partitionByLabel", function() {
      it("should sum up counts and durations for each event", function() {
        var entries = getStatEntries();
        var statsByLabel = partitionByLabel(entries);
        expect(_.keys(statsByLabel)).toEqual(["A", "B", "C"]);
        expect(statsByLabel["A"]).toEqual({count: 5, duration: 500});
        expect(statsByLabel["B"]).toEqual({count: 5, duration: 500});
        expect(statsByLabel["C"]).toEqual({count: 3, duration: 300});
      });
    });

    describe("exclusivePartitionByLabel", function() {
      it("should sum up durations without double-counting or changing counts",
         function()
      {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries);
        expect(_.keys(statsByLabel)).toEqual(["A", "B", "C"]);
        expect(statsByLabel["A"]).toEqual({count: 5, duration: 200});
        expect(statsByLabel["B"]).toEqual({count: 5, duration: 200});
        expect(statsByLabel["C"]).toEqual({count: 3, duration: 100});
      });

      it("should only count the labels given (if passed as param)", function()
      {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries, ["A", "B"]);
        expect(_.keys(statsByLabel)).toEqual(["A", "B"]);
        expect(statsByLabel["A"]).toEqual({count: 5, duration: 250});
        expect(statsByLabel["B"]).toEqual({count: 5, duration: 250});
      });

      it("does not choke if all labels excluded from a partition", function() {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries, ["C"]);
        expect(_.keys(statsByLabel)).toEqual(["C"]);
        expect(statsByLabel["C"]).toEqual({count: 3, duration: 300});
      });
    });

    describe("valuesByLabel", function() {
      it("should sum up and fill in values for a sequence of stats",
        function()
      {
        var vals = valuesByLabel(
          [{
            A: { count: 1, duration: 100 },
          }, {
            A: { count: 2, duration: 200 },
            B: { count: 3, duration: 300 }
          }, {
            B: { count: 4, duration: 400 },
            C: { count: 5, duration: 500 }
          }, {
            C: { count: 6, duration: 600 },
            A: { count: 7, duration: 700 }
          }]
        );
        expect(_.keys(vals)).toEqual(["A", "B", "C"]);

        expect(vals["A"]).toEqual({
          totalCount: 10,
          counts: [1, 2, 0, 7],
          totalDuration: 1000,
          durations: [100, 200, 0, 700]
        });

        expect(vals["B"]).toEqual({
          totalCount: 7,
          counts: [0, 3, 4, 0],
          totalDuration: 700,
          durations: [0, 300, 400, 0]
        });

        expect(vals["C"]).toEqual({
          totalCount: 11,
          counts: [0, 0, 5, 6],
          totalDuration: 1100,
          durations: [0, 0, 500, 600]
        });
      });
    });

    describe("getDurationsOverTime", function() {
      function getStats() {
        return {
          stats: [{
            window_start: "2015-10-05T21:18:08.020-08:00",
            partition: [{
              event_labels: ["A", "B"],
              event_count: 2,
              event_duration: 200
            }, {
              event_labels: ["A"],
              event_count: 1,
              event_duration: 100
            }]
          }, {
            window_start: "2015-11-05T21:18:08.020-08:00",
            partition: [{
              event_labels: ["B", "C"],
              event_count: 2,
              event_duration: 200
            }, {
              event_labels: ["B"],
              event_count: 1,
              event_duration: 100
            }]
          }],
          ready: true
        }
      }

      it("should return totals and values for each label, non-exclusively, " +
         "sorted in descending order", function()
      {
        var val = getDurationsOverTime(getStats());
        expect(val).toEqual([{
          label: "B",
          total: 500,
          values: [200, 300]
        }, {
          label: "A",
          total: 300,
          values: [300, 0]
        }, {
          label: "C",
          total: 200,
          values: [0, 200]
        }]);
      });
    });

    describe("formatWindowStarts", function() {
      function getStarts(): StatResults {
        return {
          stats: [{
            window_start: "2015-10-05T21:18:08.020-08:00",
            partition: []
          }, {
            window_start: "2015-11-05T21:18:08.020-08:00",
            partition: []
          }, {
            window_start: "2015-12-05T21:18:08.020-08:00",
            partition: []
          }]
        }
      }

      it("should format for DAILY interval", function() {
        var val = formatWindowStarts(getStarts(), Interval.DAILY);
        expect(val.typeLabel).toEqual("Day");
        expect(val.groupLabels).toEqual(["Oct 5", "Nov 5", "Dec 5"]);
      });

      it("should format for WEEKLY interval", function() {
        var val = formatWindowStarts(getStarts(), Interval.WEEKLY);
        expect(val.typeLabel).toEqual("Week Starting");
        expect(val.groupLabels).toEqual(["Oct 5", "Nov 5", "Dec 5"]);
      });

      it("should format for MONTHLY interval", function() {
        var val = formatWindowStarts(getStarts(), Interval.MONTHLY);
        expect(val.typeLabel).toEqual("Month");
        expect(val.groupLabels).toEqual(["Oct", "Nov", "Dec"]);
      });
    });
  });
}