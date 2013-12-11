/*
  Stylable replacement for <select>
*/

var select = (function() {
  var mod = {};

  /*
    parameters:
    {
      buttonWidth: "123px"
      initialValue: "squirrel",
      defaultAction: ...,
      options: [
        { label: "Select one" },
        { label: "Spaghetti with meatballs", value: "spaghetti",
          action: (function(value) { ...}) },
        { label: "Frozen squirrel", key: "squirrel", value: "frozen_squirrel",
          action: (function(value) { ...}) }
      ]
    }

    return: { view, get, set }
   */

  function valueOfOption(o) {
    if (util.isNotNull(o) && util.isDefined(o.value))
      return o.value;
    else
      return null;
  }

  function keyOfOption(o) {
    if (util.isString(o.key))
      return o.key;
    else if (util.isString(o.value))
      return o.value;
    else
      return null;
  }

  function hasKey(o) {
    return keyOfOption(o) !== null;
  }

  mod.create = function(param) {
    var view = $("<div class='btn-group'>");
    var button = $("<button type='button'/>")
      .addClass("btn btn-default dropdown-toggle")
      .attr("data-toggle", "dropdown")
      .appendTo(view);
    var buttonLabel = $("<span/>").appendTo(button);
    $("<span class='caret'/>").appendTo(button);

    var state = null;
    var tbl = {};
    var unsetLabel = "";

    function addButtonClass() {
      var className = param.buttonClass;
      if (className !== null)
        button.addClass(className);
    }

    function setButtonLabel(o) {
      if (state === null)
        buttonLabel.text(unsetLabel + " ");
      else
        buttonLabel.text(o.label + " ");
    }

    var ul = $("<ul class='dropdown-menu' role='menu'/>")
      .appendTo(view);
    if (param.id !== undefined) ul.attr("id", param.id);

    function runAction(o, x) {
      var action;
      if (util.isDefined(o.action))
        action = o.action;
      else if (util.isDefined(param.defaultAction))
        action = param.defaultAction;
      else
        action = function(x) {};
      action(x);
    }

    list.iter(param.options, function(o) {
      var k = keyOfOption(o);
      var v = valueOfOption(o);

      if (k !== null)
        tbl[k] = o;
      else
        unsetLabel = util.isString(o.label) ? o.label : "";

      var li = $("<li/>").appendTo(ul);
      var a = $("<a href='#'/>")
        .text(o.label)
        .click(function() {
          state = v;
          addButtonClass();
          setButtonLabel(o);
          view.removeClass("open"); /* needed b/c we block the event */
          runAction(o, state);
          return false; /* block event, prevent link from being followed */
        })
        .appendTo(li);
    });

    function get() {
      return state;
    }

    function set(k, noAction) {
      var o = util.isString(k) ? tbl[k] : null;
      state = valueOfOption(o);
      addButtonClass();
      setButtonLabel(o);
      if (state !== null)
        if (noAction !== true && util.isDefined(o.action))
          o.action(state);
    }

    var initialKey = util.isDefined(param.initialKey) ?
      param.initialKey
      : keyOfOption(param.options[0]);

    set(initialKey, true);

    return {
      view: view,
      get: get,
      set: set
    };
  };

  return mod;
}());
