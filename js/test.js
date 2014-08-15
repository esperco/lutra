/*
  Unit testing
*/

var test = (function() {
  var mod = {};

  function append(nodes) {
    $("#test-content").append(nodes);
  }

  function print() {
    var a = arguments;
    var root = $("#test-content");
    root
      .append($("<hr/>"));
    list.iter(a, function(x) {
      log(x);
      var s = util.toString(x);
      root
        .append($("<pre/>").text(s));
    });
  }

  mod.assert = function(b) {
    if (!b) {
      log("Failed assertion");
      console.trace();
    }
    return b;
  };

  function runOne(groupName, x) {
    var name = x[0];
    var f = x[1];
    if (f())
      print("TEST OK     " + groupName + " - " + name);
    else
      print("TEST FAILED " + groupName + " - " + name);
  }

  function runGroup(x) {
    var groupName = x[0];
    print("--- " + groupName + " ---");
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
        print("FAILED " + title,
              "-- expected:", expected,
              "-- actual:", result);
      return success;
    }];
  };

  function tests() {
    return [
      ["list", list.tests],
      ["util", util.tests],
    ];
  }

  function run() {
    append("<h2>Tests</h2>");
    list.iter(tests(), runGroup);
  };

  mod.load = function() {
    run();
  }

  return mod;
}());
