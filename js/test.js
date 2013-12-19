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
    log("--- " + groupName + " ---");
    var l = x[1];
    list.iter(l, function(x) { runOne(groupName, x); });
  }

  function preparePrintableObject(x) {
    var y = {};
    for (var k in x)
      y[k] = preparePrintable(x[k]);
    return y;
  }

  function preparePrintable(x) {
    var s = Object.prototype.toString.call(x);
    if (s === "[object Array]")
      return list.map(x, preparePrintable);
    else if (s === "[object Object]")
      return preparePrintableObject(x);
    else if (s === "[object Function]")
      return s;
    else
      return x;
  }

  mod.toString = function(x) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x
    else
      return JSON.stringify(preparePrintable(x), undefined, 2);
  };

  mod.expect = function(title, f, arg, expected) {
    var title = typeof title === "string" ? title : JSON.stringify(expected);
    return [title, function() {
      var result = f(arg);
      var success = JSON.stringify(result) === JSON.stringify(expected);
      if (!success)
        log("FAILED " + title, "-- expected:", expected, "-- actual:", result);
      return success;
    }];
  };

  function tests() {
    return [
      ["list", list.tests],
      ["date", date.tests],
      ["timeonly", timeonly.tests],
      ["email", email.tests]
    ];
  }

  mod.run = function() {
    list.iter(tests(), runGroup);
  };

  return mod;
}());
