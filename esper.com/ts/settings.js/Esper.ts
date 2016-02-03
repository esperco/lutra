/*
  This module defines the type definitions for the various vendor files
  that have been named-spaced via the vendor.js file, and sets up a base
  Esper module.
*/

/// <reference path="../../../typings/browser.d.ts" />

declare module Esper {
  export var _: _.LoDashStatic;
  export var $: JQueryStatic;
  export var jQuery: JQueryStatic;
  export var moment: moment.MomentStatic;
  export var CryptoJS: CryptoJS.CryptoJSStatic;
  export var pageJs: PageJS.Static;
  export var PRODUCTION: boolean;
  export var quill: QuillStatic;
}
