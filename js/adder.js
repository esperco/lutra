/*
  Add/remove button that changes from a + to a x and vice-versa
  when clicked on.
*/

var adder = (function() {
  var mod = {};

  function createListView(profs) {
'''
<div #view
     class="add-option-row click-mode">
  <div #adderList
         class="adder-list"/>
  <div #addClick
       class="add-option-click clearfix">
    <div #adder
         class="add-option-sq">
      <div #plus
           class="plus-option"/>
    </div>
    <div #addOption
         class="add-option-text unselectable">
      Add meeting option
    </div>
  </div>
  <div #formContainer
       class="hide"/>
  <div #help
       class="options-help-row">
    <div class="options-help clearfix">
      <div #icon
           class="options-help-icon"/>
      <div #helpText
           class="options-help-text"/>
    </div>
  </div>
</div>
'''
    var plusIcon = $("<img/>")
      .appendTo(plus);
    svg.loadImg(plusIcon, "/assets/img/plus.svg");

    var img = $("<img/>")
      .appendTo(icon);
    svg.loadImg(img, "/assets/img/options-help.svg");

    var hostName = profile.firstName(profs[login.leader()].prof);
    var possessive = hostName;
    if (hostName.slice(-1) === "s") {
      possessive += "'";
    } else {
      possessive += "'s"
    }

    helpText
      .append($("<span>Each meeting option will be automatically added to "
        + possessive + " calendar with a </span>"))
      .append($("<span class='bold'>HOLD</span>"))
      .append($("<span> label and a link to the most up-to-date information "
        + "on this meeting.</span>"));

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
    var profs = param.profs;
    var createAdderForm = param.createAdderForm;
    var userOnAdderOpen = param.onAdderOpen;
    var userOnAdderClose = param.onAdderClose;

    var currentLength = 0;
    var listView = createListView(profs);

    function onMaxLength() {
      listView.addClick
        .addClass("hide");
      listView.help
        .addClass("hide");
    }
    function onLegalLength() {
      listView.addClick
        .removeClass("hide");
      listView.help
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

    function toggleAddOption(cancelAdd) {
      if (listView.formContainer.hasClass("hide")) {
        listView.view.removeClass("click-mode");
        listView.addClick.addClass("cancel-mode");
        listView.addOption.addClass("hide");
        listView.formContainer.children().remove();
        listView.formContainer
          .append(createAdderForm(cancelAdd))
          .removeClass("hide");
        listView.adder
          .removeClass("return-to-add")
          .addClass("cancel");
        listView.plus
          .removeClass("return-to-add")
          .addClass("cancel");
        if (util.isDefined(userOnAdderOpen))
          userOnAdderOpen();
      } else {
        clearAddOption();
      }
    }

    function clearAddOption() {
      listView.view.addClass("click-mode");
      listView.addClick.removeClass("cancel-mode");
      listView.addOption.removeClass("hide");
      listView.adder
        .removeClass("cancel")
        .addClass("return-to-add");
      listView.plus
        .removeClass("cancel")
        .addClass("return-to-add");
      listView.formContainer.children().remove();
      listView.formContainer
        .addClass("hide");
      if (util.isDefined(userOnAdderClose))
        userOnAdderClose();
    }

    function createCancelLink() {
      return $("<span class='cancel-edit-mode link'/>")
        .text("Cancel")
        .click(clearAddOption);
    }

    listView.addClick.click(function() {
      toggleAddOption(createCancelLink);
    })

    return {
      view: listView.view,
      createRow: createRow, // returns the dom element and a remove function
      listLength: (function() { return currentLength; }),
      adderIsOpen: (function() { return adderIsOpen; })
    };
  };

  return mod;
})();
