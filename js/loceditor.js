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
      <div class="modal-header clearfix">
        <button #saveButton
                type="button" class="btn btn-primary"
                style="float:right">Save</button>
        <h3 #modalTitle
            class="modal-title">Enter your location details:</h3>
      </div>
      <div #body
           class="modal-body">

        <div class="input">
          <h4 class="modal-first-section-title">Location Name</h4>
          <input #title
                 type="text" class="form-control"/>
        </div>

        <div class="input">
          <h4 class="modal-section-title">Address</h4>

          <input #address
                 type="text" class="form-control"/>
          <div class="dropdown">
            <a #dropdownToggle
               data-toggle="dropdown"
               class="hide dropdown-toggle" href="#"></a>
            <ul #dropdownMenu
                class="dropdown-menu"
                role="menu"></ul>
          </div>
        </div>

        <div class="input">
          <h4 class="modal-section-title">Notes</h4>
          <input #instructions
                 type="text" class="form-control"/>
        </div>
        <button #deleteButton
                type="button" class="btn btn-default hide disabled">
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

    setLocation(_view, initLoc);

    if (util.isNonEmptyString(initLoc.google_description))
      address.prop("disabled", true);

    _view.focus = function() { address.focus(); };

    return _view;
  }

  function getLocation(view) {
    return {
      /* input boxes */
      title: view.title.val(),
      address: view.address.val(),
      instructions: view.instructions.val(),

      /* hidden values */
      coord: view.coord,
      timezone: view.timezone,
      google_description: view.google_description,
      placeid: view.placeid
    };
  }

  function setLocation(view, loc) {
    var title = loc.title;
    var address = loc.address;

    /* use copy of original search box if nothing else is available */
    if (! util.isNonEmptyString(title))
      title = loc.search;
    if (! util.isNonEmptyString(address))
      address = loc.search;

    view.title.val(title);
    view.address.val(address);
    view.instructions.val(loc.instructions);

    view.coord = loc.coord;
    view.timezone = loc.timezone;
    view.google_description = loc.google_description;
    view.placeid = loc.placeid;

    updateSaveButton(view);
    updateDeleteButton(view);
  }

  /* Display addresses as autocompleted by Google */
  function displayAddressDropdown(view, predictions) {
    if (predictions.from_google.length === 0) return;
    var menu = view.dropdownMenu;
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
              var title = details.name.length > 0 ? details.name : description;
              setLocation(view, {
                title: title,
                address: details.formatted_address,
                coord: details.geometry,
                google_description: description
              });
              util.hideDropdown(view.dropdownToggle);
            });
          return false;
        });
    });

    util.showDropdown(view.dropdownToggle);
  }

  function predictAddress(view) {
    var address = view.address.val();
    if (address === "") return;
    api.getPlacePredictions(address)
      .done(function(predictions) {
        displayAddressDropdown(view, predictions);
      });
  }

  function savePlace(view) {
    var loc = getLocation(view);
    var google_description = loc.google_description;
    if (util.isDefined(google_description)) {
      var coord = loc.coord;
      var edit = {
        title: loc.title,
        address: loc.address,
        instructions: loc.instructions,
        google_description: google_description,
        geometry: loc.coord
      };
      var placeid = loc.placeid;
      if (util.isDefined(placeid))
        return api.postEditPlace(placeid, edit);
      else
        return api.postCreatePlace(google_description, edit);
    }
    else
      return deferred.fail();
  }

  function deletePlace(view) {
    var loc = getLocation(view);
    var placeid = loc.placeid;
    if (util.isDefined(placeid))
      return api.deletePlace(placeid);
    else
      return deferred.defer();
  }

  function updateSaveButton(view) {
    var loc = getLocation(view);
    if (util.isDefined(loc.google_description))
      view.saveButton.removeClass("disabled");
    else
      view.saveButton.addClass("disabled");
  }

  function updateDeleteButton(view) {
    /* button is initially hidden; we show it only once deletion
       becomes possible which may not happen,
       depending on whether the original input was a saved place
       and whether we close the dialog upon saving.
    */
    var loc = getLocation(view);
    if (util.isDefined(loc.placeid)) {
      view.deleteButton.removeClass("hide");
      view.deleteButton.removeClass("disabled");
    }
    else
      view.deleteButton.addClass("disabled");
  }

  mod.create = function(initLoc, onSave, onDelete) {
    var view = createModal(initLoc);

    util.afterTyping(view.address, 250, function() {
      predictAddress(view);
    });

    view.saveButton
      .click(function() {
        savePlace(view)
          .done(function() {
             view.modal.modal("hide");
            onSave(getLocation(view));
          });
      });
    updateSaveButton(view);

    view.deleteButton
      .click(function() {
        deletePlace(view)
          .done(function() {
            view.modal.modal("hide");
            onDelete(getLocation(view));
          });
      });
    updateDeleteButton(view);

    view.modal.modal({});

    view.modal
      .on("shown.bs.modal", function() {
        view.focus();
      });

    return view;
  };

  return mod;
})();
