/* Define external libs used by test.js */

/// <reference path="../../../typings/tsd.d.ts"/>

// React is a namespace, so we need a way to refer to its type
type ReactStatic = typeof React;

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
  export var page: PageJS.Static;
  export var twttr: Twitter;
  export var PRODUCTION: boolean;
}

