module Esper.Log {
  /*
    Change this tag to distinguish between different scripts
    logging to the same console.
  */
  export var tag = "Esper";

  /* Enable this to turn all log messages into traces in development */
  export var enableTracing = true;

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

    // If we're not using Chrome --> don't tra

    // Trace in dev mode (unless error, since error traces itself)
    var extraTrace = false;
    if (consoleFunc !== console.error && enableTracing && !Esper.PRODUCTION) {
      if (window["chrome"]) {
        // Chrome's console.trace actually showsmessage in trace, so replace
        // consoleFunc with trace
        consoleFunc = console.trace;
      } else {
        // Trace message now display, so trace now and then run original
        // consoleFunc again
        console.trace.apply(console, args);
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

  /* error */
  export function error(...a: any[]) {
    logBase(console.error, Level.ERROR, "E", a);
  }
  export var e = error;

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
