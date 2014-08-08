module Esper.Log {
  /*
    Change this tag to distinguish between different scripts
    logging to the same console.
  */
  export var tag = "Esper";

  function prefixLines(prefix, text) {
    return text.replace(/\n/mg, "\n" + prefix);
  }

  /*
    Render multiline strings as:

Esper D xxxxxxx
Esper . xxx xxxxx
Esper . xxxxxxxx

   */
  function logArray(prefix, args) {
    for (var i = 0; i < args.length; i++)
      if (console != undefined && console.log != undefined) {
        var s = Util.toString(args[i]);
        if (i === 0)
          s = tag + " " + prefix + " " + s;
        else
          s = tag + " . " + s;
        console.log(prefixLines(tag + " . ", s));
      }
  }

  /* debug */
  export function d(...a: any[]) {
    //if (! Conf.prod)
      logArray("D", a);
  }

  /* info */
  export function i(...a: any[]) {
    logArray("I", a);
  }

  /* warning */
  export function w(...a: any[]) {
    logArray("W", a);
  }

  /* error */
  export function e(...a: any[]) {
    logArray("E", a);
  }

  /* Log the beginning and the end of something */
  export function start(...a: any[]): { (): void } {
    var id = Util.randomString();
    logArray("BEGIN " + id, a);
    return function() {
      logArray("END " + id, a);
    }
  }
}
