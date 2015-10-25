/*
  Contains helpers for runnings tests using Marten's test runner, Jasmine,
  and React.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/react/react-global.d.ts" />
/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

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

  // Returns the test window object (e.g. it's global scope)
  export function getTestWindow() {
    var frame = getTestFrame();
    return (<any>frame.get(0)).contentWindow;
  }

  // Render a React Component into a DOM
  export function render(elm: React.ReactElement<any>) {
    var TestUtils = React.addons.TestUtils;
    return TestUtils.renderIntoDocument(elm);
  };

  // Helper for comparing a ReactElement vs. expected class and props in
  // Jasmine. Does a shallow comparison on props.
  export function cmpReact(element: React.ReactElement<any>,
      cls: typeof React.Component, props: any = {}) {
    var getName = function(constructor: any) {
      return constructor.name || constructor.toString().match(/^.*$/m)[0];
    }
    expect(element.type).toBe(cls,
      `Expected ${element.type && getName(element.type)} ` +
      `to be ${getName(cls)}`);
    if (props) {
      expect(_.eq(props, element.props)).toBeTruthy(
        `Exepected ${JSON.stringify(props)} to be ` +
        `${JSON.stringify(element.props)}`);
    }
  }
}
