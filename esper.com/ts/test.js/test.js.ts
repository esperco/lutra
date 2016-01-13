/* Define external libs used by test.js */

/// <reference path="../../../typings/tsd.d.ts"/>

// React is a namespace, so we need a way to refer to its type
type ReactStatic = typeof React;
type ReactDOMStatic = typeof ReactDOM;

// For classes, refer to class's type
type EventEmitterType = typeof EventEmitter3.EventEmitter;

declare module Esper {
  export var _: _.LoDashStatic;
  export var $: JQueryStatic;
  export var EventEmitter: EventEmitterType;
  export var jQuery: JQueryStatic;
  export var moment: moment.MomentStatic;
  export var CryptoJS: CryptoJS.CryptoJSStatic;
  export var React: ReactStatic;
  export var ReactDOM: ReactDOMStatic;
  export var page: PageJS.Static;
  export var twttr: Twitter;
  export var PRODUCTION: boolean;
}

describe("globals", function() {
  var getGlobal = function(name: string): any {
    return (<any> window)[name];
  };

  it("should not have jQuery defined", function() {
    expect(getGlobal("$")).toBeUndefined();
    expect(getGlobal("jQuery")).toBeUndefined();
  });

  it("should not have moment defined", function() {
    expect(getGlobal("moment")).toBeUndefined();
  });

  it("should not have lodash defined", function() {
    expect(getGlobal("_")).toBeUndefined();
  });

  it("should not have CryptoJS.SHA1 properly defined", function() {
    expect(getGlobal("CryptoJS")).toBeUndefined();
  });
});

describe("Esper", function() {
  it("should have jQuery defined", function() {
    expect(Esper.$).toBeDefined();
    expect(Esper.jQuery).toBeDefined();
  });

  it("should have Bootstrap defined", function() {
    expect(Esper.$.fn.modal).toBeDefined();
  });

  it("should have moment defined", function() {
    expect(Esper.moment).toBeDefined();
  });

  it("should have moment timezone defined", function() {
    expect(Esper.moment.tz).toBeDefined();
  });

  it("should have lodash defined", function() {
    expect(Esper._).toBeDefined();
  });

  it("should have CryptoJS.SHA1 properly defined", function() {
    expect(Esper.CryptoJS.SHA1("Esper").toString())
      .toBe("ab000169b25e0576fe2498c2b2e748d71fa961a2");
  });
});
