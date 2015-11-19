/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="Views.CalendarLabeling.tsx" />

module Esper.Views {
  describe("Views.CalendarLabeling", function() {
    beforeEach(function() {
      Calendars.selectStore.reset();
      TestFixtures.mockLogin();
      Test.mockAPIs();
    });

    afterEach(function() {
      Test.cleanupRenders();
    });

    it("should not render calendar with null default selection", function() {
      spyOn(Calendars, "defaultSelection").and.returnValue(null);
      spyOn(Components.Calendar.prototype, "render")
        .and.returnValue(<span />);
      spyOn(Components.Calendar.prototype, "componentDidMount");
      var component = Test.render(<Views.CalendarLabeling />);

      expect(Calendars.defaultSelection).toHaveBeenCalled();
      expect(Components.Calendar.prototype.render).not.toHaveBeenCalled();
    });
  });
}