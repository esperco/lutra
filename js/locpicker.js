/*
  Location picker

  Input:
  - onSet(location): fired when the location is set
  - onClear(): fired when the location is cleared

  Output:
  - view: div holding anything needed to prompt the user for a location
*/

var locpicker = (function() {
  var mod = {};

  function createLocationForm() {
'''
<div #location
     class="clearfix">
  <div #timezone
       class="col-sm-3"></div>
  <div class="col-sm-6">
    <div class="location-title">Location</div>
    <input #address
           type="text" class="form-control"
           placeholder="address, neighborhood, city, state, or zip"/>
    <div class="dropdown">
      <a #dropdownToggle
         data-toggle="dropdown"
         class="hide dropdown-toggle" href="#"></a>
      <ul #dropdownMenu
          class="dropdown-menu"
          role="menu"></ul>
    </div>
  </div>
  <div class="col-sm-3">
    <div class="location-title">Notes</div>
    <input #notes
           type="text" class="form-control"
           placeholder="suite number, etc."/>
  </div>
</div>
'''

    return _view;
  }

  function createGoogleMap(mapDiv) {
    var mapOptions = {
      center: new google.maps.LatLng(37.4485044, -122.159185),
      zoom: 12
    };
    var googleMap = new google.maps.Map(mapDiv, mapOptions);
    var addressMarker = new google.maps.Marker();

    return {
      googleMap: googleMap,
      addressMarker: addressMarker
    };
  }

  function geocodeAddress(formView, googleMap) {
    var address = formView.address.val();
    if (address === "") return;
    clearSuggestions();
    api.getCoordinates(address)
      .done(function(coords) {
        var geocoded = new google.maps.LatLng(coords.lat, coords.lon);
        addressMarker.setPosition(geocoded);
        addressMarker.setMap(googleMap);
        googleMap.panTo(geocoded);
        api.getTimezone(coords.lat, coords.lon)
          .done(function(x) {
            timeZoneDropdown.set(x.timezone);
          });
      });
  }

  function getLocation(view) {
    return {
      title: view.locationTitle.val(),
      address: view.address.val(),
      instructions: view.instructions.val()
    };
  }

  function setLocation(view, loc) {
    view.title.val(loc.title);
    view.address.val(loc.address);
    view.instructions.val(loc.instructions);
  }

  /*
    Display addresses as autocompleted by Google or by Esper using
    the user's saved places.
  */
  function displayPredictionsDropdown(view, predictions) {
    if (predictions.from_saved_places.length === 0
        && predictions.from_google.length === 0) return;
    var menu = view.dropdownMenu;
    menu.children().remove();

    /*
      Create pop-up for editing and saving a location,
      taking care of synchronization between the form and the pop-up (modal).
      The pop-up is shown when the user clicks somewhere in the
      dropdown menu that opens below the address input box.
    */
    function updateForm(loc) {
      setLocation(view, loc);
    }
    var modalView = loceditor.create(getLocation(view), updateForm, updateForm);
    view.append(modalView.modal);

    /* Fill the menu with suggested addresses */
    var li = $('<li role="presentation"/>')
      .appendTo(menu);
    var bolded = "Create a place named <b>\""
      + util.htmlEscape(input) + "\"</b>";
    $('<a role="menuitem" tabindex="-1" href="#"/>')
      .html(bolded)
      .appendTo(li)
      .click(function() {
        /* TODO redo this part */
        modalView.title.val(input);
        modalView.address.prop("disabled", false);
        modalView.save.one("click", function() {
          places.saveNewPlace(false);
          view.address.val(modalView.address.val());
          var details = places.getSelectedPlaceDetails();
          var coord = details.geometry;
          api.getTimezone(coord.lat, coord.lon)
            .done(function(x) {
              timeZoneDropdown.set(x.timezone);
            });
        });
        modalView.modal.modal({});
        formView.dropdownToggle.dropdown("toggle");
        return false;
      });

    if (predictions.from_saved_places.length > 0) {
      $('<li role="presentation" class="dropdown-header"/>')
        .text("Saved Places")
        .appendTo(menu);

      list.iter(predictions.from_saved_places, function(item) {
        var bolded;
        var addr = item.loc.address;
        var title = item.loc.title;
        var esc = util.htmlEscape;
        if (item.matched_field === "Address") {
          bolded = geo.highlight(addr, [item.matched_substring]);
          if (title && title != addr) {
            bolded = "<i>" + esc(title) + "</i> - " + bolded;
          }
        } else if (item.matched_field === "Title") {
          bolded = "<i>" + geo.highlight(title, [item.matched_substring])
            + "</i> - " + esc(addr);
        } else {
          // TODO Error, bad API response, should never happen
        }
        var li = $('<li role="presentation"/>')
          .appendTo(menu);
        $('<a role="menuitem" tabindex="-1" href="#"/>')
          .html(bolded)
          .appendTo(li)
          .click(function() {
            formView.address.val(item.loc.address);
            formView.notes.val(item.loc.instructions);
            api.postSelectPlace(item.google_description)
              .done(function(place) {
                timeZoneDropdown.set(place.loc.timezone);
                modalView.dropDownToggle.dropdown("toggle");
              });
            return false;
          });
      });
      $('<li role="presentation" class="divider"/>')
        .appendTo(menu);
    }

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Suggestions from Google")
      .appendTo(menu);

    list.iter(predictions.from_google, function(item) {
      var desc = item.google_description;
      var bolded = geo.highlight(desc, item.matched_substrings);
      var li = $('<li role="presentation"/>') .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          formView.address.val(desc);
          api.getPlaceDetails(desc, item.ref_id)
            .done(function(place) {
              var coord = place.geometry;
              api.getTimezone(coord.lat, coord.lon)
                .done(function(x) {
                  timeZoneDropdown.set(x.timezone);
                });
              formView.dropdownToggle.dropdown("toggle");
            });
          return false;
        });
    });

    var toggle = formView.dropdownToggle;
    if (!toggle.parent().hasClass('open')) {
      toggle.dropdown("toggle");
    }

    var editorView = loceditor.create(initLoc, onSave, onDelete);
  }

  function predictAddress(formView) {
    var input = formView.address.val();
    if (input === "") return;
    api.getPlacePredictions(input)
      .done(function(predictions) {
        displayPredictionsDropdown(input, predictions, formView);
      });
  }

  function setup(form) {
    util.afterTyping(form.address, 250, function() {
      log("predictAddress");
      predictAddress(form);
    });
  }

  mod.create = function(param) {
    var view = $("<div/>");
    var form = createLocationForm();
    var mapView = $("<div/>");
    //var map = createGoogleMap(mapView);

    setup(form);

    view
      .append(formView.location)
      .append(mapView);

    return {
      locationView: view
    };
  }

  return mod;
})();
