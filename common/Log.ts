module Esper.Log {
  /*
    Change this tag to distinguish between different scripts
    logging to the same console.
  */
  export var tag = "Esper";

  /** The possible log levels in order, corresponding to the Log.d,
   *  Log.i, Log.w and Log.e functions respectively.
   */
  export enum Level {
    debug, info, warn, error
  }

  /** The current log level. We will only log anything at this level
   *  or above.
   *
   *  By default, it's set to "info" in production and "debug" for
   *  development.
   */
  export var level: Level = Conf.prod ? Level.info : Level.debug;

  function prefixLines(prefix, text) {
    return text.replace(/\n/mg, "\n" + prefix);
  }

  var timeOfLastLogging = 0.; /* unixtime, seconds */

  /*
    Print a separator if a lot of time has elapsed since the last time
    we logged something.
  */
  function printTimeSeparator(prefix) {
    var ts = Date.now() / 1000;
    if (timeOfLastLogging > 0 && ts - timeOfLastLogging > 20) {
      console.log("%s %s %c----- Getting back to work -----",
                  prefix, new Date(ts*1000).toString(), "color: blue");
    }
    timeOfLastLogging = ts;
  }

  /*
    Render multiline strings as:

Esper D xxxxxxx
Esper . xxx xxxxx
Esper . xxxxxxxx

   */
  function logArray(logFunction, level, args) {
    printTimeSeparator(tag + " " + level);

    /* If the first argument is a string, print the second argument
       on the same line.
       This is useful for filtering lines in the Chrome console.
    */
    var prefix = "";
    if (args.length > 1 && typeof args[0] === "string") {
      prefix = prefix + args[0];
      args.shift();
    }

    for (var i = 0; i < args.length; i++)
      if (logFunction != undefined) {
        var x = args[i];
        var s;
        if (i === 0) {
          s = tag + " " + level + " " + prefix;
        } else {
          s = tag + " . "             + prefix;
        }
        switch (typeof x) {
        case "string":
        case "number":
        case "boolean":
        case "undefined":
          logFunction("%s", s, x);
          break;
        default:
          if (x === null) {
            logFunction("%s", s, null);
          } else {
            /* Print as expandable tree
               see https://developer.chrome.com/devtools/docs/console */
            logFunction("%s %O", s, x);
          }
        }
      }
  }

  var console_log = console.log.bind(console);
  var console_info = console.info.bind(console);
  var console_warn = console.warn.bind(console);
  var console_error = console.error.bind(console);

  /* debug */
  export function d(...a: any[]) {
    if (level <= Level.debug) logArray(console_log, "D", a);
  }

  /* info */
  export function i(...a: any[]) {
    if (level <= Level.info) logArray(console_info, "I", a);
  }

  /* warning */
  export function w(...a: any[]) {
    if (level <= Level.warn) logArray(console_warn, "W", a);
  }

  /* error */
  export function e(...a: any[]) {
    if (level <= Level.error) logArray(console_error, "E", a);
  }

  /* Log the beginning and the end of something at the "debug" level. */
  export function start(...a: any[]): { (): void } {
    var id = Util.randomString();
    if (level <= Level.debug) logArray(console_log, "BEGIN " + id, a);
    return function() {
      if (level <= Level.debug) logArray(console_log, "END " + id, a);
    }
  }

  export function assert(x: boolean, message: string = "Assertion failed.") {
    /* In Chrome, this prints the same message (in red with a stack trace)
       as console.assert but interrupts the flow instead of
       just printing a message. */
    if (x !== true) {
      throw new Error(message);
    }
  }
}
