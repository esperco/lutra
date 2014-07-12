module Log {
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
          s = "Esper " + prefix + " " + s;
        else
          s = "Esper . " + s;
        console.log(prefixLines("Esper . ", s));
      }
  }

  /* debug */
  export function d(...a: any[]) {
    if (! Conf.prod)
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
}
