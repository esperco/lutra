// Sample React View and Tests. Used to snaity check TSX and React.
module Esper.TestPage {
  var React = Esper.React;

  export class IndexPage extends React.Component<{}, {}> {
    render() {
      return (
        <div className="container">
          Hello React! We are in
          <span className="mode-span">
            {__ESPER_PRODUCTION__ ? " production " : " development "}
          </span>
          mode.
        </div>
      );
    }
  }

  if (! __ESPER_PRODUCTION__) {
    describe("Index Page", function() {
      it("should be indicate development mode", function() {
        var page = Test.render(<IndexPage />);
        var node = $(React.findDOMNode(page));
        expect(node.find(".mode-span").text().trim()).toBe("development");
      });
    });
  }
}

