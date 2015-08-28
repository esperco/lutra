/*
  Contains helpers for runnings tests using Marten's test runner, Jasmine,
  and React.
*/
module Esper.Test {

  // Returns the test frame object, wrapped in jQuery
  export function getTestFrame() {
    return $("#esper-test-frame");
  };

  // Navigates to a page in the test frame
  export function goTo(href: string, done?: (event: JQueryEventObject) => void) {
    var frame = this.getTestFrame();
    if (done) {
      frame.one("load", done);
    }
    frame.attr("src", href);
  }

  // Returns JQuery-wrapped test frame's content doc to inspect
  export function getTestDoc() {
    var frame = getTestFrame();
    return $((<any> frame.get(0)).contentDocument);
  }

  // Render a React Component into a DOM
  export function render(elm: React.ReactElement<any>) {
    var TestUtils = React.addons.TestUtils;
    return TestUtils.renderIntoDocument(elm);
  };
}
