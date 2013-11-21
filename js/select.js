/*
  Stylable replacement for <select>
*/

var select = (function() {
  var mod = {};

  /*
    parameters:
    {
      initialValue: "squirrel",
      options: [
        { label: "Select one" },
        { label: "Spaghetti with meatballs", value: "spaghetti",
          action: (function(value) { ...}) },
        { label: "Frozen squirrel", value: "squirrel",
          action: (function(value) { ...}) }
      ]
    }

    return: { view, get, set }
   */
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
    var ul = $("<ul class='dropdown-menu' role='menu'/>")
      .appendTo(view);
    list.iter(param.options, function(o) {
      var v = util.isString(o.value) ? o.value : null;

      if (v !== null)
        tbl[v] = o;
      else
        unsetLabel = util.isString(o.label) ? o.label : "";

      var li = $("<li/>").appendTo(ul);
      var a = $("<a href='#'/>")
        .text(o.label)
        .click(function() {
          state = v;
          view.removeClass("open"); /* needed b/c we block the event */
          if (util.isDefined(o.action))
            o.action(state);
          return false; /* block event, prevent link from being followed */
        })
        .appendTo(li);
    });

    function get() {
      return state;
    }

    function set(v, noAction) {
      state = util.isString(v) ? v : null;
      if (state === null)
        buttonLabel.text(unsetLabel + " ");
      else {
        var o = tbl[state];
        buttonLabel.text(o.label + " ");
        if (noAction !== true && util.isDefined(o.action))
          o.action(state);
      }
    }

    var initialValue = util.isDefined(param.initialValue) ?
      param.initialValue
      : param.options[0].value;

    set(initialValue, true);

    return {
      view: view,
      get: get,
      set: set
    };
  };

  return mod;
}());
