/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />

/// <reference path="./Main.ts" />

module Esper.Main {
  describe("HTML", function() {
    beforeAll(function(done) {
      Test.goTo("/", done);
    });

    it("should have a header", function() {
      var frame = Test.getTestFrame()
      expect(Test.getTestDoc().find(Layout.headerSelector).length).toEqual(1);
    });

    it("should have a footer", function() {
      var frame = Test.getTestFrame()
      expect(Test.getTestDoc().find(Layout.footerSelector).length).toEqual(1);
    });

    it("should have a main div", function() {
      var frame = Test.getTestFrame()
      expect(Test.getTestDoc().find(Layout.mainSelector).length).toEqual(1);
    });

    it("should have a loading div", function() {
      var frame = Test.getTestFrame()
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
}
