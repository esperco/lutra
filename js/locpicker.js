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

  function createLocationForm(onTimezoneChange) {
'''
<div #location
     class="clearfix">
  <div #locationSearch class="left-inner-addon">
    <i class="glyphicon glyphicon-search"></i>
    <input #address
           type="search" class="form-control"
           placeholder="Search by address, neighborhood, city, state, or zip"/>
    <div class="dropdown">
      <a #dropdownToggle
         data-toggle="dropdown"
         class="hide dropdown-toggle" href="#"></a>
      <ul #dropdownMenu
          class="dropdown-menu"
          role="menu"></ul>
    </div>
  </div>
  <div #removeThis
       class="hide">
    <div class="col-sm-6">
      <input #instructions
             type="text" class="form-control"
             placeholder="These notes are now Address Line 2"/>
    </div>
    <div class="col-sm-6">
      <input #timezone
             type="text" class="form-control"
             placeholder="Timze zone should be hidden" disabled/>
    </div>
  </div>
  <div #locationForm>
    <div #locationDetails class="clearfix">
      <div class="col-sm-6 address-form">
        <input #locName
               type="text"
               class="form-control loc-input"
               placeholder="Location Name"/>
        <input #addressLine1
               type="text"
               class="form-control loc-input"
               placeholder="Address Line 1"/>
        <input #addressLine2
               type="text"
               class="form-control loc-input"
               placeholder="Address Line 2"/>
        <div class="clearfix">
          <div class="col-xs-6 loc-state-input">
            <input #state
                   type="text"
                   class="form-control loc-input"
                   placeholder="State"/>
          </div>
          <div class="col-xs-6 loc-zip-input">
            <input #zip
                   type="text"
                   class="form-control loc-input"
                   placeholder="Zip/Postal"/>
          </div>
        </div>
      </div>
      <div class="col-sm-6 address-map">
        <div class="map-unavailable">
          <img class="map-unavailable-pin svg"
             src="/assets/img/pin.svg"/>
          <div>MAP UNAVAILABLE</div>
        </div>
      </div>
    </div>
    <div #locationActions class="clearfix">
      <span #saveLocation
            class="save-location"/>
      <span #resetLocation
            class="reset-location">
        <img class="reset-location-icon svg"
             src="/assets/img/reset.svg"/>
        <span class="reset-location-text danger-link">
          Reset location
        </span>
      </span>
    </div>
  </div>
  <div #editor/>
</div>
'''

    var form = _view;
    /* add extra fields to carry along, for convenience */
    form.onTimezoneChange = onTimezoneChange;

    var checkbox = $("<img class='save-location-checkbox'/>")
      .appendTo(saveLocation);
    svg.loadImg(checkbox, "/assets/img/checkbox-sm.svg");
    var saveText = $("<span class='save-location-text'/>")
      .text("Save this place as a favorite")
      .appendTo(saveLocation);
    var saveTextShort = $("<span class='save-location-text-short'/>")
      .text("Save as favorite")
      .appendTo(saveLocation);

    saveLocation.click(function() {
      if (saveLocation.hasClass("checkbox-selected")) {
        saveLocation.removeClass("checkbox-selected");
      } else {
        saveLocation.addClass("checkbox-selected");
      }
    })

    return form;
  }

  function getLocation(form) {
    var loc = {
      /* hidden state */
      title: form.title,
      coord: form.coord,

      /* input boxes */
      address: form.address.val(),
      instructions: form.instructions.val(),
      timezone: form.timezone.val()
    };
    return loc;
  }

  function getCompleteLocation(form) {
    var loc = getLocation(form);
    if (util.isNonEmptyString(loc.address)
        && util.isString(loc.title)
        && util.isNonEmptyString(loc.timezone))
      return loc;
    else
      return null;
  }

  function setLocation(form, loc) {
    var oldTimezone = form.timezone.val();
    var newTimezone = loc.timezone;

    form.title = loc.title;
    form.coord = loc.coord;

    form.address.val(loc.address);
    form.instructions.val(loc.instructions);
    form.timezone.val(loc.timezone);

    if (oldTimezone !== newTimezone)
      form.onTimezoneChange(oldTimezone, newTimezone);
  }

  /*
    Create pop-up for editing and saving a location,
    taking care of synchronization between the form and the pop-up (modal).
    The pop-up is shown when the user clicks somewhere in the
    dropdown menu that opens below the address input box.
  */
  function createLocationEditor(form, loc) {
    function updateForm(loc) {
      var coord = loc.coord;
      if (util.isDefined(coord)) {
        api.getTimezone(coord.lat, coord.lon)
          .done(function(x) {
            loc.timezone = x.timezone;
            setLocation(form, loc);
          });
      }
      else /* this ideally shouldn't happen */
        setLocation(form, loc);
    }
    var modalView = loceditor.create(loc, updateForm, updateForm);

    form.editor.children().remove();
    form.editor.append(modalView.modal);
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

  /* unused - needs update and testing */
  function geocodeAddress(form, googleMap) {
    var address = form.address.val();
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

  function addCreatePlaceToMenu(form) {
    var menu = form.dropdownMenu;
    var textInput = form.address.val();
    var li = $('<li role="presentation"/>')
      .appendTo(menu);
    var bolded = "Create a place named <b>\""
      + util.htmlEscape(textInput) + "\"</b>";
    $('<a role="menuitem" tabindex="-1" href="#"/>')
      .html(bolded)
      .appendTo(li)
      .click(function() {
        var loc = getLocation(form);
        createLocationEditor(form, loc);
        return false;
      });
  }

  function addSuggestedSavedPlacesToMenu(form, predictions) {
    var menu = form.dropdownMenu;
    if (predictions.from_saved_places.length === 0) return;

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Saved Places")
      .appendTo(menu);

    list.iter(predictions.from_saved_places, function(item) {
      var bolded;
      var title = item.loc.title;
      var coord = item.loc.coord;
      var address = item.loc.address;
      var instructions = item.loc.instructions;
      var esc = util.htmlEscape;
      if (item.matched_field === "Address") {
        bolded = geo.highlight(address, [item.matched_substring]);
        if (title && title != address) {
          bolded = "<i>" + esc(title) + "</i> - " + bolded;
        }
      } else if (item.matched_field === "Title") {
        bolded = "<i>" + geo.highlight(title, [item.matched_substring])
          + "</i> - " + esc(address);
      } else {
        // TODO Error, bad API response, should never happen
      }
      var li = $('<li role="presentation"/>')
        .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          api.postSelectPlace(item.google_description)
            .done(function(place) {
              setLocation(form, {
                title: title,
                coord: coord,
                address: address,
                instructions: instructions,
                timezone: place.loc.timezone
              });
              util.hideDropdown(form.dropdownToggle);
            });
          return false;
        });
    });
    $('<li role="presentation" class="divider"/>')
      .appendTo(menu);
  }

  function addSuggestedGooglePlacesToMenu(form, predictions) {
    var menu = form.dropdownMenu;

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
            .done(function(place) {
              var coord = place.geometry;
              api.getTimezone(coord.lat, coord.lon)
                .done(function(x) {
                  var loc = item.loc;
                  setLocation(form, {
                    title: description,
                    coord: coord,
                    address: description,
                    timezone: x.timezone
                  });
                });
              util.hideDropdown(form.dropdownToggle);
            });
          return false;
        });
    });
  }

  /*
    Display addresses as autocompleted by Google or by Esper using
    the user's saved places.
  */
  function displayPredictionsDropdown(form, predictions) {
    if (predictions.from_saved_places.length === 0
        && predictions.from_google.length === 0) return;
    var menu = form.dropdownMenu;
    menu.children().remove();

    /* Add "create a place named ..." to the dropdown menu */
    addCreatePlaceToMenu(form);

    /* Fill the menu with suggested addresses from user's saved places */
    addSuggestedSavedPlacesToMenu(form, predictions);

    /* Fill the menu with suggested addresses from Google */
    addSuggestedGooglePlacesToMenu(form, predictions);

    util.showDropdown(form.dropdownToggle);
  }

  function predictAddress(form) {
    var textInput = form.address.val();
    if (textInput === "") return;
    api.getPlacePredictions(textInput)
      .done(function(predictions) {
        displayPredictionsDropdown(form, predictions);
      });
  }

  function setup(form) {
    util.afterTyping(form.address, 250, function() {
      predictAddress(form);
    });
  }

  mod.create = function(param) {
    var view = $("<div/>");
    var form = createLocationForm(param.onTimezoneChange);
    var mapView = $("<div/>");
    //var map = createGoogleMap(mapView);

    setup(form);

    view
      .append(form.location)
      .append(mapView);

    return {
      view: view,
      getCompleteLocation: (function () { return getCompleteLocation(form); }),
      setLocation: (function(loc) { return setLocation(form, loc); })
    };
  }

  return mod;
})();
