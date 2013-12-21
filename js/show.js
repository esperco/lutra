/*
  Select and show one element while hiding others.

  Usage:

  var sel = show.create({
    foo: { ids: ["foo-page"], classes: ["common-nav"] },
    bar: { ids: ["bar-page"], classes: ["common-nav"] },
    baz: { ids: ["baz-page"] }
  });

  sel.show("foo"); // hide everything then show the elements selected by foo
  sel.show("baz"); // hide everything then show the elements selected by foo
  sel.hideAll();   // hides everything

  By default hiding an element is achieved by adding the class "hide"
  (default offClass="hide") and showing an element is achieved by removing
  the class "hide" (default offClass="").

  Options can be passed as a second parameter to show.create:

  var sel = show.create({
    foo: { ids: ["foo-page"], classes: ["common-nav"] },
    bar: { ids: ["bar-page"], classes: ["common-nav"] },
    baz: { ids: ["baz-page"] }
  }, {
    onClass: "highlighted",
    offClass: "",
  });

  It is possible to select items of arbitrary types.
  In this case, custom functions hideOne and showOne must be passed in:

  var sel = show.create({
    foo: "foo",
    bar: "bar"
  }, {
    showOne: function(k, v) { console.log("show " + v); },
    hideOne: function(k, v) { console.log("hide " + v); },
  });
*/

var show = (function () {
  var mod = {};

  function defaultShow(k, v, onClass, offClass) {
    if (util.isDefined(v.ids)) {
      list.iter(v.ids, function(id) {
        $("#" + id)
          .removeClass(offClass)
          .addClass(onClass);
      });
    }
    if (util.isDefined(v.classes)) {
      list.iter(v.classes, function(class_) {
        $("." + class_)
          .removeClass(offClass)
          .addClass(onClass);
      });
    }
  }

  function defaultHide(k, v, onClass, offClass) {
    if (util.isDefined(v.ids)) {
      list.iter(v.ids, function(id) {
        $("#" + id)
          .removeClass(onClass)
          .addClass(offClass);
      });
    }
    if (util.isDefined(v.classes)) {
      list.iter(v.classes, function(class_) {
        $("." + class_)
          .removeClass(onClass)
          .addClass(offClass);
      });
    }
  }

  /*
    Options may be passed as an object with the following fields:
    - onClass: string (default: "")
    - offClass: string (default: "hide")
    - showOne/hideOne: string -> 'a -> unit
       (default: 'a = { ids: string list; classes: string list }
       uses the parameters above)
   */
  mod.create = function(tbl, opt) {
    var opt = util.isObject(opt) ? opt : {};
    var onClass = util.isString(opt.onClass) ? opt.onClass : "";
    var offClass = util.isString(opt.offClass) ? opt.offClass : "hide";
    var defaultShowOne =
      function(k, v) { defaultShow(k, v, onClass, offClass); };
    var defaultHideOne =
      function(k, v) { defaultHide(k, v, onClass, offClass); };

    var showOne = util.isDefined(opt.showOne) ? opt.showOne : defaultShowOne;
    var hideOne = util.isDefined(opt.hideOne) ? opt.hideOne : defaultHideOne;

    function hideAll() {
      for (var k in tbl) {
        var x = tbl[k];
        hideOne(k, x);
      }
    }

    /*
      Note that the selected page is shown last.
      This allows an element with multiple classes
      to be selected and shown on multiple pages.
    */
    function show(k) {
      for (var k2 in tbl) {
        var v2 = tbl[k2];
        if (k !== k2)
          hideOne(k2, v2);
      }
      showOne(k, tbl[k]);
    }

    return { hideAll : hideAll,
             show : show };
  }

  return mod;
}());
