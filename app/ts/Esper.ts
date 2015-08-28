/*
  This module should be referenced first by Marten. It handles bringing in our
  type definitions, references to external vendor files, and sets up
  the Esper namespace.

  This module should not be referenced outside of Marten unless you actually
  want to import any all of the dependencies below. You should create something
  similar to it though.
*/

/// <reference path="../marten/typings/tsd.d.ts"/>

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

  export var PRODUCTION: boolean;
}

Esper.PRODUCTION = false; // default