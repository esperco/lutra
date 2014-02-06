/*
  Places Page
*/

var places = (function() {
  var mod = {};

  var selectedPlaceDesc = null;
  var selectedPlaceDetails = null;

  function addressDropdown(predictions, writeName) {
    if (predictions.from_google.length == 0) return;
    var menu = $("#places-address-dropdown-menu");
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
              selectedPlaceDesc = description;
              selectedPlaceDetails = details;
              if (writeName) {
                $("#edit-place-location-title").val(details.name);
              }
              $("#edit-place-address").val(details.formatted_address);
              $('#places-address-dropdown-toggle').dropdown("toggle");
            });
          return false;
        });
    });

    var toggle = $('#places-address-dropdown-toggle');
    if (!toggle.parent().hasClass('open')) {
      toggle.dropdown("toggle");
    }
  }

  function prefillEditModal(place) {
    $("#edit-place-location-title").val(place.loc.title);
    $("#edit-place-address").val(place.loc.address);
    $("#edit-place-instructions").val(place.loc.instructions);
  }

  function emptyEditModal() {
    selectedPlaceDesc = null;
    selectedPlaceDetails = null;
    $("#edit-place-location-title").val("");
    $("#edit-place-address").val("");
    $("#edit-place-instructions").val("");
  }

  function savePlaceChanges(place) {
    var editModal = $("#edit-place-modal");
    editModal.modal("hide");
    var title = $("#edit-place-location-title").val();
    var address = $("#edit-place-address").val();
    var instructions = $("#edit-place-instructions").val();
    var google_description = null;
    var geometry = null;
    if (selectedPlaceDetails) {
      google_description = selectedPlaceDesc;
      geometry = selectedPlaceDetails.geometry;
    } else {
      google_description = place.google_description;
      geometry = place.loc.coord;
    }
    var edit = {
      title: (title == "" ? place.loc.title : title),
      address: (address == "" ? place.loc.address : address),
      instructions:
        (instructions == "" ? place.loc.instructions : instructions),
      google_description: google_description,
      geometry: geometry
    };
    var uid = login.me();
    api.postEditPlace(uid, place.placeid, edit)
      .done(function() {
        api.getPlaceList(uid).done(displayPlaces);
      });
  }

  function editAction(place) {
    var editModal = $("#edit-place-modal");
    prefillEditModal(place);
    if (place.uses == 0) {
      $("#edit-place-address").prop("disabled", false);
    } else {
      $("#edit-place-address").prop("disabled", true);
    }
    $("#edit-place-save").one("click", function() {
      savePlaceChanges(place);
      return false;
    });
    $("#edit-place-delete")
      .removeClass("hide")
      .one("click", function() {;
        removePlace(login.me(), place.placeid);
        return false;
      });
    $("#edit-place-title").text("Change your location details:");
    editModal.modal({});
  }

  function viewOfPlaceDetails(place, title, address) {
    var placeDetails = $("<div class='col-xs-5 place-details'/>")
    $("<div class='place-name ellipsis'/>")
      .text(title)
      .appendTo(placeDetails)
      .click(function() { editAction(place); return false; });
    var placeLoc = $("<div class='place-loc'/>")
      .appendTo(placeDetails);
    $("<div class='place-loc-1 ellipsis'/>")
      .text(address)
      .appendTo(placeLoc);
    $("<div class='place-loc-2 ellipsis'/>")
      .text("") // TODO Make API call return place in two lines
      .appendTo(placeLoc);
    return placeDetails;
  }

  function viewOfStats(uses) {
    // TODO Shouldn't have to put hide in the classes here?
    var mobileStats = $("<div class='stats mobile-stats hide'/>");

    var lastVisitDiv = $("<div class='col-xs-8 last-visit'/>")
      .appendTo(mobileStats);
    var statDiv1 = $("<div class='stat-div clearfix'/>")
      .appendTo(lastVisitDiv);
    var lastVisitStat = $("<div class='stat last-visit-stat'/>")
      .text("0") // TODO Last visit date
      .appendTo(statDiv1);
    var timeAgoText = $("<div class='time-ago-text'/>")
      .html($("<div>DAYS</div><div>AGO</div>"))
      .appendTo(statDiv1);
    var lastVisitText = $("<div class='stat-text'>Last visit</div>")
      .appendTo(lastVisitDiv);
    var visitsDiv = $("<div class='col-xs-4 visits'/>")
      .appendTo(mobileStats);
    var statDiv2 = $("<div class='stat-div clearfix'/>")
      .appendTo(visitsDiv);
    var visitsStat = $("<div class='stat visits-stat'/>")
      .text(uses)
      .appendTo(statDiv2);
    var visitsText = $("<div class='stat-text'>Visits</div>")
      .appendTo(visitsDiv);

    var desktopStats = $("<div class='col-xs-3 stats'/>")
      .append(lastVisitDiv.clone())
      .append(visitsDiv.clone());

    return {mobile: mobileStats, desktop: desktopStats};
  }

  function viewOfActions(place) {
    var actions = $("<div class='col-xs-4 place-actions'/>")

    var edit =
      $("<a/>", {
        href: "#",
        "data-toggle": "tooltip",
        title: "Edit",
        "class": "col-xs-4 place-action place-edit-div"
      }).appendTo(actions);
    var editImg = $("<img class='svg place-edit'/>")
      .appendTo(edit);
    svg.loadImg(editImg, "/assets/img/edit.svg");
    edit.click(function() { editAction(place); return false; });

    var directionsURL = "http://maps.google.com/?daddr="
      + place.loc.coord.lat + "," + place.loc.coord.lon;
    var directions =
      $("<a/>", {
        href: directionsURL,
        "data-toggle": "tooltip",
        title: "Get directions",
        "class": "col-xs-4 place-action directions-div"
      }).appendTo(actions);
    var directionsImg = $("<img class='svg directions'/>")
      .appendTo(directions);
    svg.loadImg(directionsImg, "/assets/img/directions.svg");
    directions.click(function() { this.target = "_blank"; });

    var yelp =
      $("<a/>", {
        href: "#",
        "data-toggle": "tooltip",
        title: "View on Yelp",
        "class": "col-xs-4 place-action yelp-div"
      }).appendTo(actions);
    var yelpImg = $("<img class='svg yelp'/>")
      .appendTo(yelp);
    svg.loadImg(yelpImg, "/assets/img/yelp.svg");

    return actions;
  }

  function viewOfPlace(place) {
    var view = $("<div class='place-row clearfix'/>");

    var placeDetails =
      viewOfPlaceDetails(place, place.loc.title, place.loc.address)
        .appendTo(view);

    var stats = viewOfStats(place.uses);
    stats.mobile.appendTo(placeDetails);
    stats.desktop.appendTo(view);

    viewOfActions(place).appendTo(view);

    return view;
  }

  /* Sort by uses descending (most uses first)
   * Among same uses, sort alphabetically by title
   * Among same title, sort alphabetically by address */
  function placeListComparator(p1, p2) {
    if (p2.uses - p1.uses > 0) {
      return 1;
    } else if (p1.uses - p2.uses > 0) {
      return -1;
    } else {
      if (p1.loc.title > p2.loc.title) {
        return 1;
      } else if (p2.loc.title > p1.loc.title) {
        return -1;
      } else {
        if (p1.loc.address > p2.loc.address) {
          return 1;
        } else if (p2.loc.address > p1.loc.address) {
          return -1;
        } else {
          return 0;
        }
      }
    }
  }

  function displayPlaces(placeList) {
    var sortedPlaces = placeList.sort(placeListComparator);
    var placesView = $("#places");
    placesView.children().remove();
    list.iter(sortedPlaces, function(place) {
      viewOfPlace(place).appendTo(placesView);
    });
    display.updateHome();
    util.focus();
  }

  function predictAddress() {
    var address = $("#edit-place-address").val();
    if (address == "") return;
    api.getPlacePredictions(address)
      .done(function(predictions) {
        addressDropdown(predictions, true);
      });
  }

  function saveNewPlace(refreshDisplay) {
    if (selectedPlaceDetails) {
      var editModal = $("#edit-place-modal");
      editModal.modal("hide");
      var title = $("#edit-place-location-title").val();
      var address = $("#edit-place-address").val();
      var instructions = $("#edit-place-instructions").val();
      var edit = {
        title: title,
        address: address,
        instructions: instructions,
        google_description: selectedPlaceDesc,
        geometry: selectedPlaceDetails.geometry
      };
      var uid = login.me();
      api.postCreatePlace(uid, selectedPlaceDesc, edit)
        .done(function() {
          if (refreshDisplay) {
            api.getPlaceList(uid).done(displayPlaces);
          }
        });
    }
  }

  function removePlace(uid, placeid) {
    $("#edit-place-modal").modal("hide");
    api.deletePlace(uid, placeid).done(function() {
      api.getPlaceList(uid).done(displayPlaces);
    });
  }

  function newPlaceAction() {
    var editModal = $("#edit-place-modal");
    $("#edit-place-save").one("click", function() {
      saveNewPlace(true);
      return false;
    });
    emptyEditModal();
    $("#edit-place-address").prop("disabled", false);
    $("#edit-place-delete").addClass("hide");
    $("#edit-place-title").text("Enter your location details:");
    editModal.modal({});
  }

  mod.addressDropdown = addressDropdown;
  mod.saveNewPlace = saveNewPlace;
  mod.emptyEditModal = emptyEditModal;

  mod.getSelectedPlaceDetails = function () {
    return selectedPlaceDetails;
  }

  mod.load = function() {
    api.getPlaceList(login.me()).done(displayPlaces);
    util.afterTyping($("#edit-place-address"), 250, predictAddress);
    $("#new-place-btn").click(newPlaceAction);

    var editModal = $("#edit-place-modal");
    editModal.on("hidden.bs.modal", function() {
      $("#edit-place-save").off("click");
      $("#edit-place-delete").off("click");
    });
  };

  return mod;
}());
