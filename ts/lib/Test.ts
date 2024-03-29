/*
  Contains helpers for runnings tests using Marten's test runner, Jasmine,
  and React.
*/

/// <reference path="./Api.ts" />

module Esper.Test {
  var frameCls = "esper-test-frame";
  var frameContainer = "#esper-test-frame-container";

  // Create a new test frame
  function newFrame() {
    $(frameContainer).prepend(`<iframe class="${frameCls}" />`);
  }

  // Returns the test frame object, wrapped in jQuery
  export function getTestFrame() {
    return $("." + frameCls).first();
  };

  // Navigates to a page in the test frame
  export function goTo(href: string,
      done?: (event: JQueryEventObject) => void,
      conditional?: (event: JQueryEventObject) => void) {
    newFrame();
    var frame = this.getTestFrame();
    if (done) {
      var cb = function(e: JQueryEventObject) {
        if (conditional && !conditional(e)) {
          frame.one("load", cb);
        } else {
          done(e);
        }
      }
      frame.one("load", cb);
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

  // Track renderings
  var renderContainers: HTMLElement[] = [];

  // Render a React Component into a DOM
  export function render(elm: React.ReactElement<any>) {
    var container = document.createElement('div')
    renderContainers.push(container);
    return ReactDOM.render(elm, container);
  };

  export function cleanupRenders() {
    _.each(renderContainers || [], (container) => {
      ReactDOM.unmountComponentAtNode(container)
    });
    renderContainers = [];
  }

  // Helper for comparing a ReactElement vs. expected class and props in
  // Jasmine. Does a shallow comparison on props.
  export function cmpReact(element: React.ReactElement<any>,
      cls: typeof React.Component, props?: any) {
    var getName = function(constructor: any) {
      return constructor.name || constructor.toString().match(/^.*$/m)[0];
    }
    expect(element.type).toBe(cls,
      `Expected ${element.type && getName(element.type)} ` +
      `to be ${getName(cls)}`);
    if (props) {
      expect(_.isEqual(props, element.props)).toBeTruthy(
        `Expected ${JSON.stringify(props)} to be ` +
        `${JSON.stringify(element.props)}`);
    }
  }

  // Mock all APIs
  export function mockAPIs() {
    for (var name in Api) {
      if (Api.hasOwnProperty(name) && (<any> Api)[name] instanceof Function) {
        if (! isSpy((<any> Api)[name])) {
          spySafe(Api, name).and.returnValue($.Deferred<any>().promise());
        }
      }
    }

    // for (var name in ApiC) {
    //   if (ApiC.hasOwnProperty(name) &&
    //       (<any> ApiC)[name].orig instanceof Function) {
    //     if (! isSpy((<any> ApiC)[name].orig)) {
    //       spySafe((<any> ApiC)[name], "orig").and
    //         .returnValue($.Deferred<any>().promise());
    //     }
    //   }
    // }
  }

  // Returns true if something has already been spied upon -- uses undocumented
  // API in Jasmine
  export function isSpy(f: Function): boolean {
    return (<any> jasmine).isSpy(f);
  }

  // Spy on things and don't break if already spied upon
  export function spySafe(o: any, name: string): jasmine.Spy {
    return isSpy(o[name]) ? o[name] : spyOn(o, name);
  }
}
