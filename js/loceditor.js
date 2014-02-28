/*
  Widget for editing and saving a location
*/

var loceditor = (function() {
  var mod = {};

  function createModal(initLoc) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog">
    <div class="modal-close-circ" data-dismiss="modal">
      <img class="svg modal-close-x" src="/assets/img/x.svg"/>
    </div>
    <div class="modal-content">
      <div class="modal-header">
        <button #save
                type="button" class="btn btn-primary"
                style="float:right">Save</button>
        <h3 #modalTitle
            class="modal-title"></h3>
      </div>
      <div #body
           class="modal-body">
        <div class="input">
          <h4 class="modal-first-section-title">Address</h4>

        <input #address
               type="text" class="form-control"
               disabled/>
        <div class="dropdown">
          <a #dropdownToggle
             data-toggle="dropdown"
             class="hide dropdown-toggle" href="#"></a>
          <ul #dropdownMenu
              class="dropdown-menu"
              role="menu"></ul>
        </div>

        <div class="input">
          <h4 class="modal-section-title">Location Name</h4>
          <input #title
                 type="text" class="form-control"/>
        </div>

        </div>
        <div class="input">
          <h4 class="modal-section-title">Description</h4>
          <input #instructions
                 type="text" class="form-control"/>
        </div>
        <button #delete_
                type="button" class="btn btn-default hide">
          Remove Place
        </button>
      </div>
    </div>
  </div>
</div>
'''
    var linkedId = util.randomString();
    title.attr("id", linkedId);
    modal.attr("aria-labelledby", linkedId);

    title.val(initLoc.title);
    address.val(initLoc.address);
    instructions.val(initLoc.instructions);

    return _view;
  }

  function getLocation(view) {
    return {
      title: view.locationTitle.val(),
      address: view.address.val(),
      instructions: view.instructions.val()
    };
  }

  /* Display addresses as autocompleted by Google */
  function displayAddressDropdown(view, predictions) {
    if (predictions.from_google.length === 0) return;
    var menu = view.dropDownMenu;
    menu.children().remove();

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Suggestions from Google")
      .appendTo(menu);

    list.iter(predictions.from_google, function(item) {
      var description = item.google_description;
      var bolded = geo.highlight(description, item.matched_substrings);
      var li = $('<li role="presentation"/>').appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          api.getPlaceDetails(description, item.ref_id)
            .done(function(details) {
              if (view.title.val() === "") {
                view.title.val(details.name);
              }
              view.address.val(details.formatted_address);
              view.dropdownToggle.dropdown("hide");
            });
          return false;
        });
    });

    view.dropdownToggle.dropdown("show");
  }

  function predictAddress(view) {
    var address = view.address.val();
    if (address === "") return;
    api.getPlacePredictions(address)
      .done(function(predictions) {
        displayAddressDropdown(view, predictions);
      });
  }

  mod.create = function(initLoc, onSave, onDelete) {
    var view = createModal(initLoc);

    util.afterTyping(view.address, 250, function() {
      log("predictAddress");
      predictAddress(view);
    });

    view.save
      .click(function() {
        /* TODO: esper api call */
        x.modal.("hide");
        x.onSave(getLocation(view));
      });

    view.delete_
      .click(function() {
        /* TODO: esper api call */
        x.modal.("hide");
        x.onDelete(getLocation(view));
      });

    return view;
  };

  return mod;
})();
