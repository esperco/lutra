/*
  Add/remove button that changes from a + to a x and vice-versa
  when clicked on.
*/

var adder = (function() {
  var mod = {};

  /*
    Simply create the +/x toggle, calling either onOpen or onClose when
    clicked.
   */
  mod.createToggle = function(param) {
    var onOpen = param.onOpen;
    var onClose = param.onClose;

    var isOpen = false;

    var view = $("<div class='add-option-sq'/>");
    var plusIcon = $("<img/>")
    var plus = $("<div class='plus-option'/>")
      .append(plusIcon)
      .appendTo(view);
    svg.loadImg(plusIcon, "/assets/img/plus.svg");

    function open() {
      if (!isOpen) {
        isOpen = true;
        view
          .removeClass("return-to-add")
          .addClass("cancel");
        plus
          .removeClass("return-to-add")
          .addClass("cancel");
      }
    }

    function close() {
      if (isOpen) {
        isOpen = false;
        view
          .addClass("return-to-add")
          .removeClass("cancel");
        plus
          .addClass("return-to-add")
          .removeClass("cancel");
      }
    }

    function toggle() {
      if (isOpen) {
        close();
        onClose();
      }
      else {
        open();
        onOpen();
      }
    }

    view.click(toggle);
    return {
      view: view,
      open: open,
      close: close,
      toggle: toggle
    };
  };

  function createListView() {
'''
<div #view
     class="option-row clearfix hide">
  <div #adderList
       class="adder-list"/>
  <div #adder
       class="adder">
    <div #toggleContainer/>
    <div #formContainer
         class="hide"/>
</div>
'''
    return _view;
  }

  /*
    Create a list view ending with an "adder" row consisting in a +/x toggle
    and a user-created form.
    Clicking on the "+" opens a form (or whatever the user specified);
    the "+" turns into a "x".
    Clicking on the "x" clears and collapses the form.
    Other user-defined actions may create or remove list elements.

    The adder is only shown if the list length does not exceed maxLength.
   */
  mod.createList = function(param) {
    var maxLength = param.maxLength;
    var createAdderForm = param.createAdderForm;
    var userOnAdderOpen = param.onAdderOpen;
    var userOnAdderClose = param.onAdderClose;

    var currentLength = 0;
    var listView = createListView();

    function onMaxLength() {
      listView.adder
        .addClass("hide");
    }
    function onLegalLength() {
      listView.adder
        .removeClass("hide");
    }

    function incrLength() {
      if (currentLength < maxLength)
        currentLength++;
      if (currentLength < maxLength)
        onLegalLength();
      else
        onMaxLength();
    }

    function decrLength() {
      if (currentLength > 0) {
        currentLength--;
        onLegalLength();
      }
    }

    function createRow(customView) {
'''
<div #row
     class="adder-row">
</div>
'''
      incrLength();
      row
        .append(customView)
        .appendTo(listView.adderList);

      function remove() {
        row.remove();
        decrLength();
      }

      return {
        view: row,
        remove: remove
      };
    }

    var adderIsOpen = false;

    function onAdderOpen() {
      adderIsOpen = true;
      listView.formContainer.children().remove();
      listView.formContainer
        .append(createAdderForm())
        .removeClass("hide");
      if (util.isDefined(userOnAdderOpen))
        userOnAdderOpen();
    }

    function clearAdder() {
      adderIsOpen = false;
      listView.formContainer.children().remove();
      listView.formContainer
        .addClass("hide");
      if (util.isDefined(userOnAdderClose))
        userOnAdderClose();
    }

    var toggle = mod.createToggle({
      onOpen: onAdderOpen,
      onClose: clearAdder
    });

    listView.toggleContainer
      .append(toggle.view);

    return {
      view: listView.view,
      createRow: createRow, // returns the dom element and a remove function
      listLength: (function() { return currentLength; }),
      adderIsOpen: (function() { return adderIsOpen; })
    };
  };

  return mod;
})();
