/// <reference path="../lib/Test.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="../lib/Login.Fake.ts" />
/// <reference path="./Integration.ts" />

module Esper.Integration {
  describe("/login", function() {
    var originalTimeout: number;

    beforeAll(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    });

    afterAll(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    beforeEach(function(done) {
      Test.goTo("/login", done);
    });

    it("should render the login container", function() {
      expect(Test.getTestDoc().find("#esper-login-container").length)
        .toEqual(1);
    });
  });

  describe("/login?logout=1", function() {
    beforeAll(function(done) {
      Login.stubLois();
      Test.goTo("/login?logout=1", done);
    });

    it("should log user out", function() {
      Login.initCredentials();
      expect(Login.myUid()).toBeUndefined();
    });
  });
}
