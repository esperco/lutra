/*
  The function we use everywhere for logging, using console.log
  and some automatic pretty-printing.
*/

module Log {

  // Variadic function - all arguments are printed
  export function p(...args: any[]) {
    for (var i = 0; i < args.length; i++)
      if (console && console.log)
        console.log(Util.toString(args[i]));
  }

}
