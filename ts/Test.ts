/*
  Contains helpers for runnings tests using Marten's test runner, Jasmine,
  and React.
*/

module Esper {

  // Test effectively functions as a module here, but we're creating it
  // manually so we can choose not to export things in production
  export var Test = (function() {
    var exports: any = {};
    if (! __ESPER_PRODUCTION__) {

      // Returns the test frame object, wrapped in jQuery
      exports.getTestFrame = function() {
        return $("#esper-test-frame");
      };

      // Navigates to a page in the test frame
      exports.goTo = function(href: string,
                              done?: (event: JQueryEventObject) => void) {
        var frame = this.getTestFrame();
        if (done) {
          frame.one("load", done);
        }
        frame.attr("src", href);
      }

      // Render a React Component into a DOM
      exports.render = function(elm: React.ReactElement<any>) {
        var TestUtils = React.addons.TestUtils;
        return TestUtils.renderIntoDocument(elm);
      };
    }
    return exports;
  })();
}

