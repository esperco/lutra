/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.TimeStats {

  function getStatEntries(): ApiT.CalendarStatEntry[] {
    return [{
      event_labels: ["A", "B"],
      event_labels_norm: ["a", "b"],
      event_count: 2,
      event_duration: 200
    }, {
      event_labels: ["A", "B", "C"],
      event_labels_norm: ["a", "b", "c"],
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
        expect(_.keys(statsByLabel)).toEqual(["a", "b", "c"]);
        expect(statsByLabel["a"]).toEqual({
          count: 5, duration: 500, displayAs: "A"
        });
        expect(statsByLabel["b"]).toEqual({
          count: 5, duration: 500, displayAs: "B"
        });
        expect(statsByLabel["c"]).toEqual({
          count: 3, duration: 300, displayAs: "C"
        });
      });
    });

    describe("exclusivePartitionByLabel", function() {
      it("should sum up durations without double-counting or changing counts",
         function()
      {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries);
        expect(_.keys(statsByLabel)).toEqual(["a", "b", "c"]);
        expect(statsByLabel["a"]).toEqual({
          count: 5, duration: 200, displayAs: "A"
        });
        expect(statsByLabel["b"]).toEqual({
          count: 5, duration: 200, displayAs: "B"
        });
        expect(statsByLabel["c"]).toEqual({
          count: 3, duration: 100, displayAs: "C"
        });
      });

      it("should only count the labels given (if passed as param)", function()
      {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries, ["a", "b"]);
        expect(_.keys(statsByLabel)).toEqual(["a", "b"]);
        expect(statsByLabel["a"]).toEqual({
          count: 5, duration: 250, displayAs: "A"
        });
        expect(statsByLabel["b"]).toEqual({
          count: 5, duration: 250, displayAs: "B"
        });
      });

      it("does not choke if all labels excluded from a partition", function() {
        var entries = getStatEntries();
        var statsByLabel = exclusivePartitionByLabel(entries, ["c"]);
        expect(_.keys(statsByLabel)).toEqual(["c"]);
        expect(statsByLabel["c"]).toEqual({
          count: 3, duration: 300, displayAs: "C"
        });
      });
    });

    describe("valuesByLabel", function() {
      it("should sum up and fill in values for a sequence of stats",
        function()
      {
        var vals = valuesByLabel(
          [{
            a: { count: 1, duration: 100, displayAs: "A" },
          }, {
            a: { count: 2, duration: 200, displayAs: "A" },
            b: { count: 3, duration: 300, displayAs: "B" }
          }, {
            b: { count: 4, duration: 400, displayAs: "B" },
            c: { count: 5, duration: 500, displayAs: "C" }
          }, {
            c: { count: 6, duration: 600, displayAs: "C" },
            a: { count: 7, duration: 700, displayAs: "A" }
          }]
        );
        expect(_.keys(vals)).toEqual(["a", "b", "c"]);

        expect(vals["a"]).toEqual({
          displayAs: "A",
          totalCount: 10,
          counts: [1, 2, 0, 7],
          totalDuration: 1000,
          durations: [100, 200, 0, 700]
        });

        expect(vals["b"]).toEqual({
          displayAs: "B",
          totalCount: 7,
          counts: [0, 3, 4, 0],
          totalDuration: 700,
          durations: [0, 300, 400, 0]
        });

        expect(vals["c"]).toEqual({
          displayAs: "C",
          totalCount: 11,
          counts: [0, 0, 5, 6],
          totalDuration: 1100,
          durations: [0, 0, 500, 600]
        });
      });
    });

    describe("getDurationsOverTime", function() {
      function getStats(): StatResults {
        return {
          stats: [{
            window_start: "2015-10-05T21:18:08.020-08:00",
            partition: [{
              event_labels: ["A", "B"],
              event_labels_norm: ["a", "b"],
              event_count: 2,
              event_duration: 200
            }, {
              event_labels: ["A"],
              event_labels_norm: ["a"],
              event_count: 1,
              event_duration: 100
            }]
          }, {
            window_start: "2015-11-05T21:18:08.020-08:00",
            partition: [{
              event_labels: ["B", "C"],
              event_labels_norm: ["b", "c"],
              event_count: 2,
              event_duration: 200
            }, {
              event_labels: ["B"],
              event_labels_norm: ["b"],
              event_count: 1,
              event_duration: 100
            }]
          }],
          ready: true
        }
      }

      it("should return totals and values for each label, non-exclusively, " +
         "sorted in descending order, with display text", function()
      {
        var val = getDurationsOverTime(getStats());
        expect(val).toEqual([{
          labelNorm: "b",
          displayAs: "B",
          total: 500,
          values: [200, 300]
        }, {
          labelNorm: "a",
          displayAs: "A",
          total: 300,
          values: [300, 0]
        }, {
          labelNorm: "c",
          displayAs: "C",
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
