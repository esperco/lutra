/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Integration.ts" />

module Esper.Integration {
  describe("/time", function() {
    describe("when logged in", function() {
      beforeAll(function(done) {
        stubLois();
        Test.goTo("/time", done);
      });

      it("should have a header", function() {
        expect(Test.getTestDoc().find(Layout.headerSelector).length).toEqual(1);
      });

      it("should have a footer", function() {
        expect(Test.getTestDoc().find(Layout.footerSelector).length).toEqual(1);
      });

      it("should have a main div", function() {
        expect(Test.getTestDoc().find(Layout.mainSelector).length).toEqual(1);
      });

      it("should have a loading div", function() {
        expect(Test.getTestDoc().find(Layout.loadingSelector).length).toEqual(1);
      });

      describe("after loading", function() {
        beforeAll(function(cb) {
          Test.getTestWindow().Layout.onLoaderHide.done(cb);
        });

        it("should hide the loader div", function() {
          expect(Test.getTestDoc().find(Layout.loadingSelector).is(":visible"))
            .toBe(false);
        });
      });
    });

    describe("when not logged in", function() {
      beforeAll(function(done) {
        clearLogin();
        Test.goTo("/time", function() {
          // Wait for one redirect -- failure to call results in timeout
          Test.getTestFrame().one("load", done);
        });
      });

      it("should redirect to login page", function() {
        var frame = Test.getTestFrame()
        expect(Test.getTestWindow().location.pathname).toEqual("/login");
      });
    })
  });
}
