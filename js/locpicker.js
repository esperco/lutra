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

  // Set by setPositionFromNavigator, stored until refresh
  var position = null;

  function toggleForm(form) {
    if (form.locationSearch.hasClass("hide")) {
      form.locationSearch.removeClass("hide");
      form.locationForm.addClass("hide");
    } else {
      form.locationSearch.addClass("hide");
      form.locationForm.removeClass("hide");
    }
  }

  function createGoogleMap(mapDiv, pos) {
    var mapOptions = { center: pos, zoom: 12 };
    var googleMap = new google.maps.Map(mapDiv, mapOptions);
    var addressMarker = new google.maps.Marker();

    return { googleMap: googleMap, addressMarker: addressMarker };
  }

  function createLocationForm(param) {
'''
<div #location
     class="clearfix">
  <div #locationSearch class="left-inner-addon">
    <i class="glyphicon glyphicon-search"></i>
    <input #searchBox
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
  <div #locationForm
       class="hide">
    <div #locationDetails class="clearfix">
      <div class="col-sm-7 address-form">
        <input #title
               type="text"
               class="form-control loc-input"
               placeholder="Location name"/>
        <input #address
               type="text"
               class="form-control loc-input"
               placeholder="Address" disabled/>
        <input #instructions
               type="text"
               class="form-control loc-input"
               placeholder="Suite #, access code, etc."/>
        <span #resetLocation
              class="reset-location">
          <img class="reset-location-icon svg"
               src="/assets/img/reset.svg"/>
          <span class="reset-location-text danger-link">
            Reset location
          </span>
        </span>
      </div>
      <div class="col-sm-5 address-map">
        <div #map
             class="map-available"/>
        <div class="map-unavailable hide">
          <img class="map-unavailable-pin svg"
             src="/assets/img/pin.svg"/>
          <div>MAP UNAVAILABLE</div>
        </div>
      </div>
    </div>
  </div>
  <div #editor/>
</div>
'''
    var form = _view;
    /* add extra fields to carry along, for convenience */
    form.onTimezoneChange = param.onTimezoneChange;
    form.onLocationSet = param.onLocationSet;

    return form;
  }

  function getLocation(form) {
    var loc = {
      /* hidden state */
      coord: form.coord,
      timezone: form.timezone,

      /* input boxes */
      title: form.title.val(),
      address: form.address.val(),
      instructions: form.instructions.val(),

      /* copy contents of search box for loceditor */
      search: form.searchBox.val(),
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

  function getTimezoneLocation(form) {
    var loc = getLocation(form);
    var completeLoc = getCompleteLocation(form);
    if (completeLoc === null) {
      if (util.isNonEmptyString(loc.timezone)) {
        var result = {
          title: "",
          address: "",
          instructions: "",
          timezone: loc.timezone
        };
        return result;
      }
      else
        return null;
    }
    else
      return null;
  }

  function setLocationNoCallback(form, loc, place) {
    var oldTimezone = form.timezone;
    var newTimezone = loc.timezone;

    if (util.isNotNull(loc.coord)) {
      form.map.children().remove();
      var pos = new google.maps.LatLng(loc.coord.lat, loc.coord.lon);
      var mapView = createGoogleMap(form.map.get(0), pos);
      var map = mapView.googleMap;
      var marker = mapView.addressMarker;
      marker.setPosition(pos);
      marker.setMap(map);
      map.panTo(pos);
    }

    form.coord = loc.coord;
    form.timezone = loc.timezone;
    form.googleDescription = loc.google_description;

    if (util.isNotNull(place)) {
      form.savedPlaceID = place.placeid;
    }

    form.title.val(loc.title);
    form.address.val(loc.address);
    form.instructions.val(loc.instructions);

    if (oldTimezone !== newTimezone)
      form.onTimezoneChange(oldTimezone, newTimezone);
  }

  function setLocation(form, loc, place) {
    setLocationNoCallback(form, loc, place);
    form.onLocationSet(loc);
  }

  function clearLocation(form) {
    setLocation(form, {});
    form.searchBox.val("")
                  .focus();
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
          bolded = esc(title) + ", " + bolded;
        }
      } else if (item.matched_field === "Title") {
        bolded = geo.highlight(title, [item.matched_substring])
          + ", " + esc(address);
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
              var loc = {
                title: title,
                coord: coord,
                address: address,
                instructions: instructions,
                timezone: place.loc.timezone,
                google_description: item.google_description
              };
              setLocation(form, loc, place);
              util.hideDropdown(form.dropdownToggle);
              toggleForm(form);
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
            .done(function(details) {
              var title =
                list.mem(details.types, "establishment") ?
                details.name :
                "";
              var coord = details.geometry;
              api.getTimezone(coord.lat, coord.lon)
                .done(function(x) {
                  var loc = item.loc;
                  setLocation(form, {
                    title: title,
                    address: details.formatted_address,
                    coord: coord,
                    google_description: description,
                    timezone: x.timezone
                  });
                });
              util.hideDropdown(form.dropdownToggle);
              toggleForm(form);
              form.title.focus();
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

    /* Fill the menu with suggested addresses from user's saved places */
    addSuggestedSavedPlacesToMenu(form, predictions);

    /* Fill the menu with suggested addresses from Google */
    addSuggestedGooglePlacesToMenu(form, predictions);

    util.showDropdown(form.dropdownToggle);
  }

  function predictAddress(form) {
    // Default: No location bias
    var lat = 0;
    var lon = 0;
    var radius = 20000000;

    if (util.isNotNull(position) && util.isNotNull(position.coords)) {
      // If position detected: Bias to within 100 km
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      radius = 100000;
    }

    var textInput = form.searchBox.val();
    if (textInput === "") return;
    api.getPlacePredictions(textInput, lat, lon, radius)
      .done(function(predictions) {
        displayPredictionsDropdown(form, predictions);
      });
  }

  function setup(form) {
    form.locationSearch.removeClass("hide");
    form.locationForm.addClass("hide");
    util.afterTyping(form.searchBox, 250, function() {
      predictAddress(form);
    });
    form.resetLocation
      .click(function() {
        toggleForm(form);
        clearLocation(form);
      });
  }

  /*
     getCurrentPosition is an async call, but we don't want to wait for it,
     since it can take some time. Until it finishes, location biasing is
     disabled. After position is set, we remember it until the JS is reloaded.
  */
  function setPositionFromNavigator() {
    var geo = window.navigator.geolocation;
    if (util.isNotNull(geo) && position === null) {
      geo.getCurrentPosition(function(pos) {
        position = pos;
      });
    }
  }

  /*
    Parameters:
    - onLocationSet(loc):
        called when the location is set
    - onTimezoneChange(oldTz, newTz):
        called when the timezone is set or changes
   */
  mod.create = function(param) {
    log("locpicker param", param);
    var form = createLocationForm(param);
    setup(form);
    setPositionFromNavigator();

    return {
      view: form.location,
      focus: (function() { form.searchBox.focus(); }),

      /* get/set location fields of the form */
      getCompleteLocation: (function () { return getCompleteLocation(form); }),
      getTimezoneLocation: (function () { return getTimezoneLocation(form); }),
      setLocation: (function(loc) { return setLocation(form, loc); }),
      toggleForm: (function() { return toggleForm(form); }),

      /* terrible hack to work around circular dependencies */
      setLocationNoCallback:
        (function(loc) { return setLocationNoCallback(form, loc); }),

      getGoogleDescription: (function () { return form.googleDescription; }),
      getSavedPlaceID: (function () { return form.savedPlaceID; })
    };
  }

  return mod;
})();
