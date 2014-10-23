module Esper.Log {
  /*
    Change this tag to distinguish between different scripts
    logging to the same console.
  */
  export var tag = "Esper";

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
    if (timeOfLastLogging > 0 && ts - timeOfLastLogging > 20)
      console.log("%s %s %c----- Getting back to work -----",
                  prefix, new Date(ts*1000).toString(), "color: blue");
    timeOfLastLogging = ts;
  }

  /*
    Render multiline strings as:

Esper D xxxxxxx
Esper . xxx xxxxx
Esper . xxxxxxxx

   */
  function logArray(logFunction, prefix, args) {
    printTimeSeparator(tag + " " + prefix);

    /* If the first argument is a string, print the second argument
       on the same line.
       This is useful for filtering lines in the Chrome console.
    */
    if (args.length >= 1 && typeof args[0] === "string") {
      prefix = prefix + " " + args[0];
      args.shift();
    }

    for (var i = 0; i < args.length; i++)
      if (logFunction != undefined) {
        var x = args[i];
        var s;
        if (i === 0)
          s = tag + " " + prefix;
        else
          s = tag + " .";
        switch (typeof x) {
        case "string":
        case "number":
        case "boolean":
        case "undefined":
          logFunction("%s", s, x);
          break;
        default:
          if (x === null)
            logFunction("%s", s, null);
          else
            /* Print as expandable tree
               see https://developer.chrome.com/devtools/docs/console */
            logFunction("%s %O", s, x);
        }
      }
  }

  var console_log = console.log.bind(console);
  var console_info = console.info.bind(console);
  var console_warn = console.warn.bind(console);
  var console_error = console.error.bind(console);

  /* debug */
  export function d(...a: any[]) {
    //if (! Conf.prod)
      logArray(console_log, "D", a);
  }

  /* info */
  export function i(...a: any[]) {
    logArray(console_info, "I", a);
  }

  /* warning */
  export function w(...a: any[]) {
    logArray(console_warn, "W", a);
  }

  /* error */
  export function e(...a: any[]) {
    logArray(console_error, "E", a);
  }

  /* Log the beginning and the end of something */
  export function start(...a: any[]): { (): void } {
    var id = Util.randomString();
    logArray(console_log, "BEGIN " + id, a);
    return function() {
      logArray(console_log, "END " + id, a);
    }
  }
}
