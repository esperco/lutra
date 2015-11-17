/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="Views.LabelsOverTime.tsx" />

module Esper.Views {
  describe("Views.LabelsOverTime", function() {
    beforeEach(function() {
      lotCalSelectorStore.reset();
      lotIntervalSelectStore.reset();
      lotLabelSelectStore.reset();
    });

    it("should not render ChartCanvas with null default selection", function() {
      spyOn(Calendars, "defaultSelection").and.returnValue(null);
      spyOn(Components.BarChart.prototype, "render")
        .and.returnValue(<span />);
      var component = Test.render(<Views.LabelsOverTime />);

      expect(Calendars.defaultSelection).toHaveBeenCalled();
      expect(Components.BarChart.prototype.render).not.toHaveBeenCalled();
    });
  });
}