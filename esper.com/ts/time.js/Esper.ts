/// <reference path="../../../typings/browser/index.d.ts" />

// React is a namespace, so we need a way to refer to its type
type ReactStatic = typeof React;
type ReactDOMStatic = typeof ReactDOM;

// For classes, refer to class's type
type EventEmitterType = typeof EventEmitter3.EventEmitter;

declare module Esper {
  export var _: _.LoDashStatic;
  export var $: JQueryStatic;
  export var EventEmitter: EventEmitterType;
  export var Highcharts: HighchartsStatic;
  export var jQuery: JQueryStatic;
  export var moment: moment.MomentStatic;
  export var CryptoJS: CryptoJS.CryptoJSStatic;
  export var React: ReactStatic;
  export var ReactDOM: ReactDOMStatic;
  export var pageJs: PageJS.Static;
  export var PRODUCTION: boolean;
  export var TESTING: boolean;
}

