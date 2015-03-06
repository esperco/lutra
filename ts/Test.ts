/*
  Unit testing
*/

module Test {

  function append(nodes) {
    $("#test-content").append(nodes);
  }

  function print(...a: any[]) {
    var root = $("#test-content");
    root
      .append($("<hr/>"));
    List.iter(a, function(x) {
      Log.p(x);
      var s = Util.toString(x);
      root
        .append($("<pre/>").text(s));
    });
  }

  export function assert(b) {
    if (!b) {
      Log.p("Failed assertion");
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
    List.iter(l, function(x) { runOne(groupName, x); });
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
      return List.map(x, preparePrintable);
    else if (s === "[object Object]")
      return preparePrintableObject(x);
    else if (s === "[object Function]")
      return s;
    else
      return x;
  }

  export function toString(x) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x
    else
      return JSON.stringify(preparePrintable(x), undefined, 2);
  };

  export function expect(title, f, arg, expected) {
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
      ["List", List.tests],
      ["Util", Util.tests],
      ["Plan", Plan.tests]
    ];
  }

  function run() {
    append("<h2>Tests</h2>");
    List.iter(tests(), runGroup);
  };

  export function load() {
    run();
  }

}
