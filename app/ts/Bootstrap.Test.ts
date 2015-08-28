// Test the Bootstrap HTML file -- really just making sure the Test module works
module Esper.Bootstrap {
  describe("Bootstrap Page", function() {
    beforeAll(function(done) {
      Test.goTo("/bootstrap.html", done);
    });

    it("should have at least one well", function() {
      var frame = Test.getTestFrame()
      expect(Test.getTestDoc().find(".well").length).toBeGreaterThan(1);
    });
  });
}
