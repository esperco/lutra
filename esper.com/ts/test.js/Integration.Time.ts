/// <reference path="../lib/Test.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.Fake.ts" />
/// <reference path="./Integration.ts" />

module Esper.Integration {
  describe("/time", function() {
    var originalTimeout: number;

    beforeAll(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    });

    afterAll(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    describe("when logged in", function() {
      beforeAll(function(done) {
        Login.stubLois();
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
        Test.goTo("/time", done,
          // Wait for redirect before calling done
          () => Test.getTestWindow().location.pathname !== "/time");
      });

      it("should redirect to login page", function() {
        var frame = Test.getTestFrame()
        expect(Test.getTestWindow().location.pathname).toEqual("/login");
      });
    })
  });
}
