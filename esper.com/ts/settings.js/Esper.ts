/*
  This module defines the type definitions for the various vendor files
  that have been named-spaced via the vendor.js file, and sets up a base
  Esper module.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../typings/cryptojs/cryptojs.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/moment-timezone/moment-timezone.d.ts" />
/// <reference path="../typings/fullCalendar/fullCalendar.d.ts" />
/// <reference path="../typings/page/page.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/quill/quill.d.ts" />

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
