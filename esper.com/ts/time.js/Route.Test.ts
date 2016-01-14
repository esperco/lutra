/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="Route.tsx" />

module Esper.Route {
  // Helper for testing Layout.render's arguments vs. React components
  function expectRenderWith(spy: jasmine.Spy,
      main?: typeof React.Component, mainProps?: any,
      header?: typeof React.Component, headerProps?: any,
      footer?: typeof React.Component, footerProps?: any) {
    expect(spy).toHaveBeenCalled();

    var args = spy.calls.argsFor(0);
    Test.cmpReact(args[0], main, mainProps || {});

    if (arguments.length > 3) {
      if (header) {
        Test.cmpReact(args[1], header, headerProps);
      } else {
        expect(args[1]).toBeUndefined();
      }
    }

    if (arguments.length > 5) {
      if (footer) {
        Test.cmpReact(args[2], footer, footerProps);
      } else {
        expect(args[2].toBeUndefined());
      }
    }
  }


  // Actual Tests //////////////

  describe("Routes", function() {
    beforeEach(function() {
      this.spy = spyOn(Layout, "render");

      // To keep page.js from updating URL
      spyOn(history, 'pushState');
      spyOn(history, 'replaceState');

      TestFixtures.mockLogin();
    });

    it("should navigate to charts page with default route", function() {
      Route.nav.path("/");
      expectRenderWith(this.spy, Views.Charts);
    });

    it("should navigate to charts page", function() {
      Route.nav.path("/charts");
      expectRenderWith(this.spy, Views.Charts);
    });

    it("should navigate to calendar page", function() {
      Route.nav.path("/calendar-labeling");
      expectRenderWith(this.spy, Views.CalendarLabeling);
    });

    it("should navigate to 404 page if none is found", function() {
      Route.nav.path("not-a-real-page-at-all");
      expectRenderWith(this.spy, Views.NotFound);
    });

    it("should set the current object on route", function() {
      Route.nav.path("/calendar-labeling");
      expect(current).toBe("/calendar-labeling");
    });
  });
}
