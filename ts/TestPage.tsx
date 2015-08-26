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
      beforeEach(function(done) {
        Test.goTo("/", done);
      });

      it("should be indicate development mode", function() {
        var testFrame = Test.getTestFrame();
        expect(testFrame.contents().find(".mode-span").text().trim())
          .toBe("development");
      });
    });
  }
}

