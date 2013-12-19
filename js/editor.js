/*
  Poor-text HTML editor supporting the insertion of variables.
*/

var editor = (function() {
  var mod = {};

  /*
    Taken from http://stackoverflow.com/questions/6690752
    as it supports "all major browsers" (otherwise we could just pass
    the standard "insertHTML" command to document.execCommand).
    Conditional support for IE<9 was removed since we can't test it.
  */
  function insertHtml(html, selectPastedContent) {
    var sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      var range = sel.getRangeAt(0);
      range.deleteContents();

      // Range.createContextualFragment() would be useful here but is
      // only relatively recently standardized and is not supported in
      // some browsers (IE9, for one)
      var el = document.createElement("div");
      el.innerHTML = html;
      var frag = document.createDocumentFragment(), node, lastNode;
      while ( (node = el.firstChild) ) {
        lastNode = frag.appendChild(node);
      }
      var firstNode = frag.firstChild;
      range.insertNode(frag);

      // Preserve the selection
      if (lastNode) {
        var range = range.cloneRange();
        range.setStartAfter(lastNode);
        if (selectPastedContent) {
          range.setStartBefore(firstNode);
        } else {
          range.collapse(true);
        }
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  function insertVar(doc, s) {
    doc.focus();
    insertHtml("<img class='var' src='/assets/img/menu.svg'/>", false);
  }

  function makeVarButton(doc, varname) {
    return $("<button class='btn btn-default'/>")
      .text(varname)
      .click(function() {
        insertVar(doc, varname);
      });
  }

  mod.create = function(varnames) {
    var view = $("<div/>");
    var controls = $("<div/>")
      .appendTo(view);
    var doc = $("<div contenteditable='true'/>")
      .appendTo(view);

    list.iter(varnames, function(varname) {
      makeVarButton(doc, varname)
        .appendTo(controls);
    });

    return {
      view: view,
      controls: controls,
      doc: doc
    };
  }

  return mod;
}());
