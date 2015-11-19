/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="./Views.LabelsOverTime.tsx" />
/// <reference path="./TestFixtures.ts" />

module Esper.Views {
  describe("Views.LabelsOverTime", function() {
    beforeEach(function() {
      Calendars.selectStore.reset();
      lotIntervalSelectStore.reset();
      lotLabelSelectStore.reset();
      TestFixtures.mockLogin();
      Test.mockAPIs();
    });

    afterEach(function() {
      Test.cleanupRenders();
    });

    it("should not render ChartCanvas with null default selection", function() {
      spyOn(Calendars, "setDefault").and.returnValue(null);
      spyOn(TimeStats.intervalQuery, "async");
      spyOn(Components.BarChart.prototype, "render")
        .and.returnValue(<span />);
      var component = Test.render(<Views.LabelsOverTime />);

      expect(Calendars.setDefault).toHaveBeenCalled();
      expect(TimeStats.intervalQuery.async).not.toHaveBeenCalled();
      expect(Components.BarChart.prototype.render).not.toHaveBeenCalled();
    });

    describe("with non-null default selection", function() {
      beforeEach(function() {
        spyOn(TimeStats.intervalQuery, "async");
      });

      it("should call intervalQuery.async on render", function() {
        Test.render(<Views.LabelsOverTime />);
        expect(TimeStats.intervalQuery.async).toHaveBeenCalled();
      });

      it("should call intervalQuery.async on render with non-null calendar " +
         "selection", function() {
        Calendars.selectStore.set({
          teamId: "team-id-2",
          calId: "rupert@esper.com"
        });
        lotIntervalSelectStore.set(TimeStats.Interval.WEEKLY);
        Test.render(<Views.LabelsOverTime />);
        expect(TimeStats.intervalQuery.async).toHaveBeenCalled();
      });
    });
  });
}