/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="Route.tsx" />

module Esper.Route {
  // Fakes page calls
  function fakePage(path: string) {
    path = nav.normalize(path);

    // Typecast page.js as "any" object -- not ideal but this is just testing
    // and we need access to some "unofficial" funcitons
    var page = (<any> pageJs);
    var ctx = new page.Context(path);
    page.current = ctx.path;
    page.dispatch(ctx);
  }

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
      TestFixtures.mockLogin();
    });

    it("should navigate to charts page with default route", function() {
      fakePage("/");
      expectRenderWith(this.spy, Views.Charts);
    });

    it("should navigate to charts page", function() {
      fakePage("/charts");
      expectRenderWith(this.spy, Views.Charts);
    });

    it("should navigate to calendar page", function() {
      fakePage("/calendar-labeling");
      expectRenderWith(this.spy, Views.CalendarLabeling);
    });

    it("should navigate to 404 page if none is found", function() {
      fakePage("not-a-real-page-at-all");
      expectRenderWith(this.spy, Views.NotFound);
    });

    it("should set the current object on route", function() {
      fakePage("/calendar-labeling");
      expect(current).toBe("/calendar-labeling");
    });
  });
}
