/*
  This module defines the type definitions for the various vendor files
  that have been named-spaced via the vendor.js file, and sets up a base
  Esper module.
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../marten/typings/cryptojs/cryptojs.d.ts" />
/// <reference path="../marten/typings/moment/moment.d.ts" />
/// <reference path="../marten/typings/moment-timezone/moment-timezone.d.ts" />
/// <reference path="../marten/typings/fullCalendar/fullCalendar.d.ts" />
/// <reference path="../marten/typings/page/page.d.ts" />
/// <reference path="../marten/typings/lodash/lodash.d.ts" />
/// <reference path="../marten/typings/eventemitter3/eventemitter3.d.ts" />
/// <reference path="../marten/typings/react/react-global.d.ts" />

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
  export var pageJs: PageJS.Static;
  export var PRODUCTION: boolean;
}

(function(Esper: any) {
  Esper.PRODUCTION = false; // default (this gets changed by Conf files)
})(Esper || {});

