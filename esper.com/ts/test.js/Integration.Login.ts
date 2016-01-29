/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Test.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.Fake.ts" />
/// <reference path="./Integration.ts" />

module Esper.Integration {
  describe("/login", function() {
    beforeAll(function(done) {
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
