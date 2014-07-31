/*
  Capture global variables into the Esper object (TypeScript module)
  such that it's ok for other extensions to override them without
  affecting Esper.
*/

var esperjQuery;
if (typeof jQuery !== "undefined")
  esperjQuery = jQuery;

var esper$;
if (typeof $ !== "undefined")
  esper$ = $;

var esperCryptoJS;
if (typeof CryptoJS !== "undefined")
  esperCryptoJS = CryptoJS;

module Esper {
  /*
    Reference to those variables from submodules Esper.* is done without
    the "Esper." prefix, which is added by the compiler as needed.
  */
  export var jQuery;
  export var $;
  export var CryptoJS;

  if (esperjQuery !== undefined)
    jQuery = esperjQuery;
  if (esper$ !== undefined)
    $ = esper$;
  if (esperCryptoJS !== undefined)
    CryptoJS = esperCryptoJS;
}
