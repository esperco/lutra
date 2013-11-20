/*
  Unit testing
*/

var test = (function() {
  var mod = {};

  mod.assert = function(b) {
    if (!b) {
      log("Failed assertion");
      console.trace();
    }
  };

  function runOne(groupName, x) {
    var name = x[0];
    var f = x[1];
    if (f())
      log("TEST OK     " + groupName + " - " + name);
    else
      log("TEST FAILED " + groupName + " - " + name);
  }

  function runGroup(x) {
    var groupName = x[0];
    log(groupName);
    var l = x[1];
    list.iter(l, function(x) { runOne(groupName, x); });
  }

  function tests() {
    return [
      ["date", date.tests]
    ];
  }

  mod.run = function() {
    list.iter(tests(), runGroup);
  };

  return mod;
}());
