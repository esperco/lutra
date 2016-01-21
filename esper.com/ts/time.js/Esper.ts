/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../typings/chartjs/chart.d.ts" />
/// <reference path="../typings/cryptojs/cryptojs.d.ts" />
/// <reference path="../typings/fullCalendar/fullCalendar.d.ts" />
/// <reference path="../typings/highcharts/highcharts.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/moment-timezone/moment-timezone.d.ts" />
/// <reference path="../typings/page/page.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/eventemitter3/eventemitter3.d.ts" />
/// <reference path="../typings/react/react-global.d.ts" />
/// <reference path="../typings/twitter/twitter.d.ts" />

// React is a namespace, so we need a way to refer to its type
type ReactStatic = typeof React;
type ReactDOMStatic = typeof ReactDOM;

// For classes, refer to class's type
type EventEmitterType = typeof EventEmitter3.EventEmitter;
type ChartStatic = typeof Chart;

declare module Esper {
  export var _: _.LoDashStatic;
  export var $: JQueryStatic;
  export var EventEmitter: EventEmitterType;
  export var Highcharts: HighchartsStatic;
  export var jQuery: JQueryStatic;
  export var moment: moment.MomentStatic;
  export var Chart: ChartStatic;
  export var CryptoJS: CryptoJS.CryptoJSStatic;
  export var React: ReactStatic;
  export var ReactDOM: ReactDOMStatic;
  export var pageJs: PageJS.Static;
  export var PRODUCTION: boolean;
  export var TESTING: boolean;
  export var twttr: Twitter;
}

