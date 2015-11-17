/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="Views.CalendarLabeling.tsx" />

module Esper.Views {
  describe("Views.CalendarLabeling", function() {
    beforeEach(function() {
      clCalSelectStore.reset();
    });

    it("should not render calendar with null default selection", function() {
      spyOn(Calendars, "defaultSelection").and.returnValue(null);
      spyOn(Components.Calendar.prototype, "render")
        .and.returnValue(<span />);
      var component = Test.render(<Views.CalendarLabeling />);

      expect(Calendars.defaultSelection).toHaveBeenCalled();
      expect(Components.Calendar.prototype.render).not.toHaveBeenCalled();
    });
  });
}