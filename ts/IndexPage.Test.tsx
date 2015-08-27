// Tests for our index page
module Esper.IndexPage {

  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  describe("Index Page", function() {
    it("should display some text", function() {
      var page = Test.render(<IndexPage />);
      var node = $(React.findDOMNode(page));
      expect(node.text()).toBe("Hello React!");
    });
  });
}
