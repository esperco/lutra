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

    describe("intervalCountRequest", function() {
      beforeEach(function() {
        jasmine.clock().install();
      });

      afterEach(function() {
        jasmine.clock().uninstall();
      });

      describe("daily", function() {
        it("should be able to return a fixed count dating back from today",
          function()
        {
          jasmine.clock().mockDate(new Date(2015, 10, 5, 23, 59, 59, 999));
          var val = intervalCountRequest(3, Interval.DAILY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 10, 3),
              new Date(2015, 10, 4),
              new Date(2015, 10, 5)],
            windowEnd: new Date(2015, 10, 5, 23, 59, 59, 999),
            interval: Interval.DAILY
          });
        });

        it("should round to the end of the day", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5, 23));
          var val = intervalCountRequest(3, Interval.DAILY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 10, 3),
              new Date(2015, 10, 4),
              new Date(2015, 10, 5)],
            windowEnd: new Date(2015, 10, 5, 23, 59, 59, 999),
            interval: Interval.DAILY
          });
        });
      });

      describe("weekly", function() {
        it("should be able to return a fixed count dating back from today",
          function()
        {
          jasmine.clock().mockDate(new Date(2015, 10, 7, 23, 59, 59, 999));
          var val = intervalCountRequest(3, Interval.WEEKLY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 9, 18),
              new Date(2015, 9, 25),
              new Date(2015, 10, 1)],
            windowEnd: new Date(2015, 10, 7, 23, 59, 59, 999),
            interval: Interval.WEEKLY
          });
        });

        it("should round to the end of the week (Saturday)", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5));
          var val = intervalCountRequest(3, Interval.WEEKLY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 9, 18),
              new Date(2015, 9, 25),
              new Date(2015, 10, 1)],
            windowEnd: new Date(2015, 10, 7, 23, 59, 59, 999),
            interval: Interval.WEEKLY
          });
        });
      });

      describe("monthly", function() {
        it("should be able to return a fixed count dating back from today",
          function()
        {
          jasmine.clock().mockDate(new Date(2015, 10, 30, 23, 59, 59, 999));
          var val = intervalCountRequest(3, Interval.MONTHLY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 8, 1),
              new Date(2015, 9, 1),
              new Date(2015, 10, 1)],
            windowEnd: new Date(2015, 10, 30, 23, 59, 59, 999),
            interval: Interval.MONTHLY
          });
        });

        it("should round to the end of the month", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5));
          var val = intervalCountRequest(3, Interval.MONTHLY);
          expect(val).toEqual({
            windowStarts: [
              new Date(2015, 8, 1),
              new Date(2015, 9, 1),
              new Date(2015, 10, 1)],

            /*
              In JS, Date(2015, 10, 5) is November 5, not October 5, hence
              why the end of the month is the 30th, not the 31st.
            */
            windowEnd: new Date(2015, 10, 30, 23, 59, 59, 999),
            interval: Interval.MONTHLY
          });
        });
      });
    });

    describe("periodRequest", function() {
      it("should return unrounded daily intervals between start and end " +
         "dates", function()
      {
        var val = periodRequest(new Date(2015, 10, 1, 12),
                                new Date(2015, 10, 3, 12),
                                Interval.DAILY);
        expect(val).toEqual({
          windowStarts: [
            new Date(2015, 10, 1, 12),
            new Date(2015, 10, 2),
            new Date(2015, 10, 3)],

          /*
            In JS, Date(2015, 10, 5) is November 5, not October 5, hence
            why the end of the month is the 30th, not the 31st.
          */
          windowEnd: new Date(2015, 10, 3, 12),
          interval: Interval.DAILY
        });
      });

      it("should return unrounded daily intervals between start and end " +
         "weeks", function()
      {
        var val = periodRequest(new Date(2015, 9, 20),
                                new Date(2015, 10, 5),
                                Interval.WEEKLY);
        expect(val).toEqual({
          windowStarts: [
            new Date(2015, 9, 20),
            new Date(2015, 9, 25),
            new Date(2015, 10, 1)],

          /*
            In JS, Date(2015, 10, 5) is November 5, not October 5, hence
            why the end of the month is the 30th, not the 31st.
          */
          windowEnd: new Date(2015, 10, 5),
          interval: Interval.WEEKLY
        });
      });

      it("should return unrounded daily intervals between start and end " +
         "months", function()
      {
        var val = periodRequest(new Date(2015, 9, 5),
                                new Date(2015, 11, 5),
                                Interval.MONTHLY);
        expect(val).toEqual({
          windowStarts: [
            new Date(2015, 9, 5),
            new Date(2015, 10, 1),
            new Date(2015, 11, 1)],

          /*
            In JS, Date(2015, 10, 5) is November 5, not October 5, hence
            why the end of the month is the 30th, not the 31st.
          */
          windowEnd: new Date(2015, 11, 5),
          interval: Interval.MONTHLY
        });
      });
    });

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

    describe("getDisplayResults", function() {
      function getStats(): ApiT.CalendarStats[] {
        return [{
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
        }];
      }

      it("should return totals and values for each label, non-exclusively, " +
         "sorted in descending order, with display text", function()
      {
        var val = getDisplayResults(getStats());
        val = _.sortBy(val, (v) => -v.totalCount);
        expect(val).toEqual([{
          labelNorm: "b",
          displayAs: "B",
          totalDuration: 500,
          durations: [200, 300],
          totalCount: 5,
          counts: [2, 3]
        }, {
          labelNorm: "a",
          displayAs: "A",
          totalDuration: 300,
          durations: [300, 0],
          totalCount: 3,
          counts: [3, 0]
        }, {
          labelNorm: "c",
          displayAs: "C",
          totalDuration: 200,
          durations: [0, 200],
          totalCount: 2,
          counts: [0, 2]
        }]);
      });
    });

    describe("formatWindowStarts", function() {
      function getStarts(): ApiT.CalendarStats[] {
        return [{
          window_start: "2015-10-05T21:18:08.020-08:00",
          partition: []
        }, {
          window_start: "2015-11-05T21:18:08.020-08:00",
          partition: []
        }, {
          window_start: "2015-12-05T21:18:08.020-08:00",
          partition: []
        }];
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
