// Tests for our index page
module Esper.IndexPage {
  describe("Index Page", function() {
    it("should be indicate development mode", function() {
      var page = Test.render(<IndexPage />);
      var node = $(React.findDOMNode(page));
      expect(node.text()).toBe("Hello React!");
    });
  });
}
