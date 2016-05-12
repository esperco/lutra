/// <reference path="./Test.ts" />
/// <reference path="./Period.ts" />

module Esper.Period {
  describe("Period", function() {
    describe("singleFromDate", function() {
      it("can return a week interval period", function() {
        expect(singleFromDate("week", new Date(1970, 0, 12))).toEqual({
          interval: "week",
          index: 2
        });
      });

      it("can return a month interval period", function() {
        expect(singleFromDate("month", new Date(1970, 1, 12))).toEqual({
          interval: "month",
          index: 1
        });
      });

      it("can return a quarter interval period", function() {
        expect(singleFromDate("quarter", new Date(1970, 7, 12))).toEqual({
          interval: "quarter",
          index: 2
        });
      });
    });

    describe("rangeFromDates", function() {
      it("should return multiple periods if necessary", function() {
        expect(rangeFromDates("week",
          new Date(1970, 0, 1),
          new Date(1970, 0, 12)
        )).toEqual({
          interval: "week",
          start: 0,
          end: 2
        });
      });

      it("should return a single period if sufficient", function() {
        expect(rangeFromDates("week",
          new Date(1970, 0, 6),
          new Date(1970, 0, 8)
        )).toEqual({
          interval: "week",
          start: 1,
          end: 1
        });
      });
    });

    describe("boundsFromPeriod", function() {
      it("should return start and end dates for a period", function() {
        var period: Single = { interval: "month", index: 553 }; // Feb 2016
        expect(boundsFromPeriod(period)).toEqual([
          new Date(2016, 1, 1),
          new Date(2016, 1, 29, 23, 59, 59, 999)
        ]);
      });

      it("should handle week boundaries properly", function() {
        // NB: We should make this test locale independent, but for now, we
        // assume that the week starts on Sunday
        var localeData: any = moment.localeData();
        expect(localeData.firstDayOfWeek()).toEqual(0);

        var period: Single = { interval: "week", index: 1 };
        expect(boundsFromPeriod(period)).toEqual([
          new Date(1970, 0, 4),
          new Date(1970, 0, 10, 23, 59, 59, 999)
        ]);
      });
    });

    describe("relativeIndex", function() {
      beforeEach(function() {
        jasmine.clock().install();
        var baseTime = new Date(2016, 1, 22); // Feb 22, month is 0-indexed
                                              // Quarter 184 since epoch
        jasmine.clock().mockDate(baseTime);
      });

      afterEach(function() {
        jasmine.clock().uninstall();
      });

      it("should return positive value for intervals greater than current",
      function() {
        expect(relativeIndex({ interval: "quarter", index: 186 })).toEqual(2);
      });

      it("should return negative value for intervals less than current",
      function() {
        expect(relativeIndex({ interval: "quarter", index: 182 })).toEqual(-2);
      });
    });
  });
}
