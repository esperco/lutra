/// <reference path="./Util.ts" />

declare module Esper {
  export var PRODUCTION: boolean;
}

module Esper.Log {

  /*
    Change this tag to distinguish between different scripts
    logging to the same console.
  */
  export var tag = "Esper";

  // Shims
  if (! window.console) {
    window.console = <any>{ log: function () {} };
  }
  console.trace  = console.trace || console.log;
  console.info   = console.info || console.log;
  console.warn   = console.warn || console.log;
  console.error  = console.error || console.log;

  // Log level - change to set min threshhold for logging
  // Level.BOOM -> means don't log (exceptions only)
  export enum Level { DEBUG, INFO, WARN, ERROR, BOOM };
  export var level: Level;

  /*
    Print a separator if a lot of time has elapsed since the last time
    we logged something.
  */
  var timeOfLastLogging = 0; /* unixtime, seconds */
  function printTimeSeparator(prefix: string): void {
    var ts = Date.now() / 1000;
    if (timeOfLastLogging > 0 && ts - timeOfLastLogging > 20)
      console.info("%s %s %c----- Getting back to work -----",
                    prefix, new Date(ts*1000).toString(), "color: blue");
    timeOfLastLogging = ts;
  }

  // Helper function to add stuff to loggin
  function logBase(consoleFunc: (...a: any[]) => void,
                   level: Level, prefix: string, args: any[]) {

    // Don't log if silenced
    var minLevel: Level = level;
    if (typeof minLevel === "undefined") {
      // Default to warn & above for production
      minLevel = Esper.PRODUCTION ? Level.WARN : Level.DEBUG;
    }
    if (level < minLevel) { return; }

    // Actual logging
    printTimeSeparator(tag);

    // Add prefix tag
    args.unshift(prefix ? tag + " " + prefix : tag);

    if (consoleFunc !== console.error && !Esper.PRODUCTION &&
        console.trace) {
      if (window.hasOwnProperty("chrome")) {
        // Chrome's console.trace actually showsmessage in trace, so replace
        // consoleFunc with trace
        consoleFunc = console.trace;
      } else {
        // Add an extra trace message
        (<any> console).trace("Tracing ...");
      }
    }

    // Log
    consoleFunc.apply(console, args);
  };

  /* debug */
  export function debug(...a: any[]) {
    logBase(console.debug, Level.DEBUG, "D", a);
  }
  export var d = debug;

  /* info */
  export function info(...a: any[]) {
    logBase(console.info, Level.INFO, "I", a);
  }
  export var i = info;

  /* warning */
  export function warn(...a: any[]) {
    logBase(console.warn, Level.WARN, "W", a);
  }
  export var w = warn;

  /* error - all errors are also logged with Raven */
  export function error(error: string|Error, details?: any) {
    logToRaven(error, details);
    logBase(console.error, Level.ERROR, "E", [error, details]);
  }
  export var e = error;

  // Logs error to Raven -- converts strings to Error
  export function logToRaven(error: string|Error, details?: any) {
    if (error instanceof Error) {
      logErrToRaven(error, details);
    } else {
      // Create error object to log so we get a traceback
      try {
        throw new Error(error);
      } catch (err) {
        logErrToRaven(err, details);
      }
    }
  }

  // Logs error with optional details
  function logErrToRaven(error: Error, details?: any) {
    /*
      Sanity check since Raven isn't deployed on all front-end stuff or
      may be unavailable
    */
    if ((<any> Esper).Raven || (<any> window).Raven) {
      if (details) {
        Raven.captureException(error, {
          extra: details
        });
      } else {
        Raven.captureException(error);
      }
    }
  }

  /* Log the beginning and the end of something */
  export function start(...a: any[]): { (): void } {
    var id = Util.randomString();
    logBase(console.info, Level.INFO, "BEGIN",
      a.concat([(new Date()).getTime()]));
    return function() {
      logBase(console.info, Level.INFO, "END",
        a.concat([(new Date()).getTime()]));
    }
  }

  /* Throws an error if something failed */
  export function assert(x: boolean, message: string = "Assertion failed.") {
    if (x !== true) {
      throw new Error(message);
    }
  }
}
