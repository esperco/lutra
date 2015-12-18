/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="./Views.Charts.tsx" />
/// <reference path="./TestFixtures.ts" />

module Esper.Views {
  describe("Views.Chart", function() {
    beforeEach(function() {
      Calendars.selectStore.reset();
      TimeStats.RequestStore.reset();
      chartsLabelSelectStore.reset();
      chartsChartTypeStore.reset();
      TestFixtures.mockLogin();
      Test.mockAPIs();
    });

    afterEach(function() {
      Test.cleanupRenders();
    });

    it("should not render chart with null default selection", function() {
      spyOn(Calendars, "setDefault").and.returnValue(null);
      spyOn(ApiC, "postForCalendarStats");
      spyOn(Views.Charts.prototype, "renderChart").and.returnValue(<span />);
      var component = Test.render(<Views.Charts />);

      expect(Calendars.setDefault).toHaveBeenCalled();
      expect(ApiC.postForCalendarStats).not.toHaveBeenCalled();
      expect(Views.Charts.prototype.renderChart).not.toHaveBeenCalled();
    });

    describe("with non-null default selection", function() {
      beforeEach(function() {
        spyOn(ApiC, "postForCalendarStats");
      });

      it("should call ApiC.postForCalendarStats on render", function() {
        Test.render(<Views.Charts />);
        expect(ApiC.postForCalendarStats).toHaveBeenCalled();
      });

      it("should call TimeStats.async on render with non-null calendar " +
         "selection", function() {
        Calendars.selectStore.set({
          teamId: "team-id-2",
          calId: "rupert@esper.com"
        });
        Test.render(<Views.Charts />);
        expect(ApiC.postForCalendarStats).toHaveBeenCalled();
      });
    });
  });
}