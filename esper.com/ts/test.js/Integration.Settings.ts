/// <reference path="../lib/Test.ts" />
/// <reference path="../lib/Login.Fake.ts" />
/// <reference path="./Integration.ts" />

module Esper.Integration {
  describe("/settings", function() {
    var originalTimeout: number;

    // Settings page can take a qhile to load because of all the AJAX calls
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
        Test.goTo("/settings", done);
      });

      it("should have a settings page div", function() {
        expect(Test.getTestDoc().find("#settings-page").length).toEqual(1);
      });
    });

    describe("when not logged in", function() {
      beforeAll(function(done) {
        clearLogin();
        Test.goTo("/settings", done,
          // Wait for redirect before calling done
          () => Test.getTestWindow().location.pathname !== "/settings");
      });

      it("should redirect to login page", function() {
        var frame = Test.getTestFrame()
        expect(Test.getTestWindow().location.pathname).toEqual("/login");
      });
    })
  });
}
