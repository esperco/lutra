/*
  Select and show one element while hiding others.

  Usage:

  sel = new show.Selector(["foo", "bar", "baz"]);
  sel.show("foo"); // hides bar and baz, then shows foo.
  sel.show("baz"); // hides foo and bar, then shows baz.
  sel.hideAll();   // hides everything
*/

var show = (function () {
  var mod = {};

  function showById(id, onClass, offClass) {
    $("#" + id)
      .removeClass(offClass)
      .addClass(onClass);
  }

  function hideById(id, onClass, offClass) {
    $("#" + id)
      .removeClass(onClass)
      .addClass(offClass);
  }

  function showByClass(class_, onClass, offClass) {
    $("." + class_)
      .removeClass(offClass)
      .addClass(onClass);
  }

  function hideByClass(class_, onClass, offClass) {
    $("." + class_)
      .removeClass(onClass)
      .addClass(offClass);
  }

  /*
    Options may be passed as an object with the following fields:
    - onClass: string (default: "")
    - offClass: string (default: "hide")
    - selectByClass: bool (default: false)
    - showOne: string -> unit (default: based on the parameters above)
    - hideOne: string -> unit (default: based on the parameters above)
   */
  mod.create = function(idList, opt) {
    var opt = util.isObject(opt) ? opt : {};
    var onClass = util.isString(opt.onClass) ? opt.onClass : "";
    var offClass = util.isString(opt.offClass) ? opt.offClass : "hide";
    var selectByClass = opt.selectByClass ? true : false;
    var defaultShowOne = selectByClass ?
      function(x) { showByClass(x, onClass, offClass); }
    : function(x) { showById(x, onClass, offClass); };
    var defaultHideOne = selectByClass ?
      function(x) { hideByClass(x, onClass, offClass); }
    : function(x) { hideById(x, onClass, offClass); };

    var showOne = util.isFunction(opt.showOne) ? opt.showOne : defaultShowOne;
    var hideOne = util.isFunction(opt.hideOne) ? opt.hideOne : defaultHideOne;

    function hideAll() {
      for (var i in idList) {
        var id = idList[i];
        log("hide all - " + id);
        hideOne(id);
      }
    }

    function show(id) {
      log("show " + id);
      for (var i in idList) {
        var id2 = idList[i];
        if (id !== id2)
          hideOne(id2);
      }
      showOne(id);
    }

    return { hideAll : hideAll,
             show : show };
  }

  return mod;
}());
