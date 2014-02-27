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

  function displayPredictionsDropdown(input, predictions, formView, modalView) {
    if (predictions.from_saved_places.length === 0
        && predictions.from_google.length === 0) return;
    var menu = modalView.dropdownMenu;
    menu.children().remove();

    var li = $('<li role="presentation"/>')
      .appendTo(menu);
    var bolded = "Create a place named <b>\""
      + util.htmlEscape(input) + "\"</b>";
    $('<a role="menuitem" tabindex="-1" href="#"/>')
      .html(bolded)
      .appendTo(li)
      .click(function() {
        places.emptyEditModal();
        modalView.locationTitle.val(input);
        modalView.address.prop("disabled", false);
        modalView.save.one("click", function() {
          places.saveNewPlace(false);
          formView.address.val(modalView.address.val());
          var details = places.getSelectedPlaceDetails();
          var coord = details.geometry;
          api.getTimezone(coord.lat, coord.lon)
            .done(function(x) {
              timeZoneDropdown.set(x.timezone);
            });
        });
        modalView.modal.modal({});
        modalView.dropdownToggle.dropdown("toggle");
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
              modalView.dropdownToggle.dropdown("toggle");
            });
          return false;
        });
    });

    var toggle = modalView.dropdownToggle;
    if (!toggle.parent().hasClass('open')) {
      toggle.dropdown("toggle");
    }
  }

  function predictAddress(formView, modalView) {
    var input = formView.address.val();
    if (input === "") return;
    api.getPlacePredictions(input)
      .done(function(predictions) {
        displayPredictionsDropdown(input, predictions, formView, modalView);
      });
  }

  function predictEditAddress(formView, modalView) {
    var input = modalView.address.val();
    if (input === "") return;
    api.getPlacePredictions(input)
      .done(function(predictions) {
        places.addressDropdown(predictions, false);
      });
  }

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
           placeholder="address, neighborhood, city, state, or zip">
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
           placeholder="suite number, etc.">
  </div>
</div>
'''

    return _view;
  }

  function createEditPlaceModal() {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog">
    <div class="modal-close-circ" data-dismiss="modal">
      <img class="svg modal-close-x" src="/assets/img/x.svg">
    </div>
    <div class="modal-content">
      <div class="modal-header">
        <button #save
                type="button" class="btn btn-primary"
                style="float:right">Save</button>
        <h3 #title
            class="modal-title"></h3>
      </div>
      <div #body
           class="modal-body">
        <div class="input">
          <h4 class="modal-first-section-title">Address</h4>

        <input #address
               type="text" class="form-control"
               disabled>
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
          <input #locationTitle
                 type="text" class="form-control">
        </div>

        </div>
        <div class="input">
          <h4 class="modal-section-title">Description</h4>
          <input #instructions
                 type="text" class="form-control">
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

    modal.on("hidden.bs.modal", function() {
      save.off("click");
      delete_.off("click");
    });

    return _view;
  }

  function setup(formView, modalView) {
    util.afterTyping(formView.address, 250, function() {
      predictAddress(formView, modalView);
    });
    util.afterTyping(modalView.address, 250, function() {
      predictEditAddress(formView, modalView);
    });
  }

  mod.create = function(param) {
    var view = $("<div/>");
    var formView = createLocationForm();
    var modalView = createEditPlaceModal();
    var mapView = $("<div/>");
    //var map = createGoogleMap(mapView);

    setup(formView, modalView);

    view
      .append(formView.form)
      .append(modalView.modal)
      .append(mapView);

    return {
      locationView: view
    };
  }

  return mod;
})();
