// Stub for Jasmine for dev mode when we're not testing
declare module Esper {
  export var TESTING: boolean;
}

if (! Esper.TESTING) {
  var glob = <any> window;
  glob.describe = function() {}
  glob.expect = function() {}
  glob.it = function() {}
}
