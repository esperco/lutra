/*
  The function we use everywhere for logging, using console.log
  and some automatic pretty-printing.
*/

// Variadic function - all arguments are printed
function log() {
  for (var i = 0; i < arguments.length; i++)
    if (console && console.log)
      console.log(util.toString(arguments[i]));
}
