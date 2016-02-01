/*
  This module defines the type definitions for the various vendor files
  that have been named-spaced via the vendor.js file, and sets up a base
  Esper module.
*/

/// <reference path="../../typings/browser.d.ts" />

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
  export var quill: QuillStatic;
  export var bloodhound: typeof Bloodhound;

  // NB: Esper.gmailJs is defined as well, but we'll set the type definitions
  // for this in the gmail-is code.

  export var PRODUCTION: boolean;

  // vendorReady is set to true by our vendor file after it has been loaded.
  // If onVendorReady is defined prior to the vendor file loading, it will be
  // called by the vendor file after loading.
  export var vendorReady: boolean;
  export var onVendorReady: () => void;
}

(function(Esper: any) {
  Esper.PRODUCTION = false; // default (this gets changed by Conf files)
})(Esper || {});

