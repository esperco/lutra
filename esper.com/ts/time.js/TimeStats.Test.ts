/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.TimeStats {

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

  ////

  describe("TimeStats", function() {

    describe("requestToJSON", function() {
      it("should use start of day for new daily interval partition",
        function()
      {
        var period = {
          windowStart: new Date(2015, 10, 3, 12),
          windowEnd: new Date(2015, 10, 5, 23),
          interval: Interval.DAILY
        };

        expect(TimeStats.requestToJSON(period)).toEqual({
          window_starts: [
            XDate.toString(period.windowStart),
            XDate.toString(new Date(2015, 10, 4)),
            XDate.toString(new Date(2015, 10, 5))
          ],
          window_end: XDate.toString(period.windowEnd)
        });
      });

      it("should create partitions when given a weekly interval",
        function()
      {
        var period = {
          windowStart: new Date(2015, 9, 18),
          windowEnd: new Date(2015, 10, 5),
          interval: Interval.WEEKLY
        };

        expect(TimeStats.requestToJSON(period)).toEqual({
          window_starts: [
            XDate.toString(period.windowStart),
            XDate.toString(new Date(2015, 9, 25)),
            XDate.toString(new Date(2015, 10, 1))
          ],
          window_end: XDate.toString(period.windowEnd)
        });
      });

      it("should create partitions when given a monthly interval",
        function()
      {
        var period = {
          windowStart: new Date(2015, 8, 1),
          windowEnd: new Date(2015, 10, 30),
          interval: Interval.MONTHLY
        };

        expect(TimeStats.requestToJSON(period)).toEqual({
          window_starts: [
            XDate.toString(period.windowStart),
            XDate.toString(new Date(2015, 9, 1)),
            XDate.toString(new Date(2015, 10, 1))
          ],
          window_end: XDate.toString(period.windowEnd)
        });
      });

      it("should cap large numbers of intervals", function() {
        var period = {
          windowStart: new Date(2015, 8, 1),
          windowEnd: new Date(2015, 12, 1),
          interval: Interval.DAILY
        };

        var ret = TimeStats.requestToJSON(period);
        expect(ret.window_starts[0])
          .toEqual(XDate.toString(period.windowStart));
        expect(ret.window_starts.length).toEqual(MAX_INTERVALS);
      });
    });

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
            windowStart: new Date(2015, 10, 3),
            windowEnd: new Date(2015, 10, 5, 23, 59, 59, 999),
            interval: Interval.DAILY
          });
        });

        it("should round to the end of the day", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5, 23));
          var val = intervalCountRequest(3, Interval.DAILY);
          expect(val).toEqual({
            windowStart: new Date(2015, 10, 3),
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
            windowStart: new Date(2015, 9, 18),
            windowEnd: new Date(2015, 10, 7, 23, 59, 59, 999),
            interval: Interval.WEEKLY
          });
        });

        it("should round to the end of the week (Saturday)", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5));
          var val = intervalCountRequest(3, Interval.WEEKLY);
          expect(val).toEqual({
            windowStart: new Date(2015, 9, 18),
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
            windowStart: new Date(2015, 8, 1),
            windowEnd: new Date(2015, 10, 30, 23, 59, 59, 999),
            interval: Interval.MONTHLY
          });
        });

        it("should round to the end of the month", function() {
          jasmine.clock().mockDate(new Date(2015, 10, 5));
          var val = intervalCountRequest(3, Interval.MONTHLY);
          expect(val).toEqual({
            windowStart: new Date(2015, 8, 1),

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

    describe("getDisplayResults", function() {
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

    describe("getExclusiveDisplayResults", function() {
      it("should return totals and values for each label, exclusively",
        function()
      {
        var val = getExclusiveDisplayResults(getStats());
        val = _.sortBy(val, (v) => -v.totalCount);
        expect(val).toEqual([{
          labelNorm: "b",
          displayAs: "B",
          totalDuration: 300,
          durations: [100, 200],
          totalCount: 5,
          counts: [2, 3]
        }, {
          labelNorm: "a",
          displayAs: "A",
          totalDuration: 200,
          durations: [200, 0],
          totalCount: 3,
          counts: [3, 0]
        }, {
          labelNorm: "c",
          displayAs: "C",
          totalDuration: 100,
          durations: [0, 100],
          totalCount: 2,
          counts: [0, 2]
        }]);
      });

      it("should only count the labels given (if passed as param)", function()
      {
        var val = getExclusiveDisplayResults(getStats(), ["a", "b"]);
        val = _.sortBy(val, (v) => -v.totalCount);

        expect(val).toEqual([{
          labelNorm: "b",
          displayAs: "B",
          totalDuration: 400,
          durations: [100, 300],
          totalCount: 5,
          counts: [2, 3]
        }, {
          labelNorm: "a",
          displayAs: "A",
          totalDuration: 200,
          durations: [200, 0],
          totalCount: 3,
          counts: [3, 0]
        }]);
      });

      it("does not choke if all labels excluded from a partition", function() {
        var val = getExclusiveDisplayResults(getStats(), ["c"]);
        val = _.sortBy(val, (v) => -v.totalCount);

        expect(val).toEqual([{
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
