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

  mod.create = function(idList, optShow, optHide) {

    var showOne = optShow ?
      optShow
      : function(id) { $("#" + id).removeClass("hide"); };

    var hideOne = optHide ?
      optHide
      : function (id) { $("#" + id).addClass("hide"); };

    function hideAll() {
      for (var i in idList) {
        hideOne(idList[i]);
      }
    }

    function show(id) {
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

  /* Use a particular class for highlighting one of the selected elements */
  mod.withClass = function(class_, idList) {
    function showOne(id) {
      $("#" + id).addClass(class_);
    }
    function hideOne(id) {
      $("#" + id).removeClass(class_);
    }
    return mod.create(idList, showOne, hideOne);
  }

  return mod;
}());
