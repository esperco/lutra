/*
  Places Page
*/

var places = (function() {
  var mod = {};

  var selectedRefId = null;

  function addressDropdown(predictions) {
    if (predictions.from_google.length == 0) return;
    var menu = $("#places-address-dropdown-menu");
    menu.children().remove();

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Suggestions from Google")
      .appendTo(menu);

    list.iter(predictions.from_google, function(item) {
      var bolded = sched2.highlight(item.description, item.matched_substrings);
      var li = $('<li role="presentation"/>')
        .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          $("#edit-place-address").val(item.description);
          selectedRefId = item.ref_id;
          $('#places-address-dropdown-toggle').dropdown("toggle");
          return false;
        });
    });

    var toggle = $('#places-address-dropdown-toggle');
    if (!toggle.parent().hasClass('open')) {
      toggle.dropdown("toggle");
    }
  }

  function drawDirections(place) {
    var coords = place.loc.coord;
    if (coords) {
      var placeGeo = new google.maps.LatLng(coords.lat, coords.lon);
      var mapOptions = { center: placeGeo, zoom: 12 };
      var mapDiv = document.getElementById("google-map-modal-body");
      $("#google-map-modal-title")
        .text("Directions to " + place.loc.title);
      var editModal = $("#google-map-modal");
      editModal.on("shown.bs.modal", function() {
        var googleMap = new google.maps.Map(mapDiv, mapOptions);
        var addressMarker = new google.maps.Marker();

        addressMarker.setPosition(placeGeo);
        addressMarker.setMap(googleMap);
        //googleMap.panTo(placeGeo);
        //google.maps.event.trigger(googleMap, "resize");
      });
      editModal.modal({});
    }
  }

  function prefillEditModal(place) {
    $("#edit-place-location-title").val(place.loc.title);
    $("#edit-place-address").val(place.loc.address);
    $("#edit-place-instructions").val(place.loc.instructions);
  }

  function emptyEditModal() {
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
    var update = {
      title: (title == "" ? place.loc.title : title),
      address: (address == "" ? place.loc.address : address),
      instructions:
        (instructions == "" ? place.loc.instructions : instructions)
    };
    var uid = login.me();
    api.postUpdatePlace(uid, place.placeid, update)
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
    var editSave = $("#edit-place-save");
    editSave.one("click", function() {
      savePlaceChanges(place);
      return false;
    });
    editModal.modal({});
  }

  function viewOfPlaceDetails(title, address) {
    var placeDetails = $("<div class='col-xs-5 place-details'/>")
    $("<a class='place-name ellipsis'/>")
      .text(title)
      .appendTo(placeDetails);
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

    var directions =
      $("<a/>", {
        href: "#",
        "data-toggle": "tooltip",
        title: "Get directions",
        "class": "col-xs-4 place-action directions-div"
      }).appendTo(actions);
    var directionsImg = $("<img class='svg directions'/>")
      .appendTo(directions);
    svg.loadImg(directionsImg, "/assets/img/directions.svg");
    directions.click(function() { drawDirections(place); return false; });

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
    view.click(function() { editAction(place); return false; });

    var placeDetails = viewOfPlaceDetails(place.loc.title, place.loc.address)
      .appendTo(view);

    var stats = viewOfStats(place.uses);
    stats.mobile.appendTo(placeDetails);
    stats.desktop.appendTo(view);

    viewOfActions(place).appendTo(view);

    return view;
  }

  function displayPlaces(placeList) {
    console.log(placeList.toSource());
    var placesView = $("#places");
    placesView.children().remove();
    list.iter(placeList, function(place) {
      viewOfPlace(place).appendTo(placesView);
    });
    display.updateHome();
    util.focus();
  }

  function predictAddress() {
    var address = $("#edit-place-address").val();
    if (address == "") return;
    var leaderUid = login.data.team.team_leaders[0];
    api.getPlacePredictions(leaderUid, address)
      .done(addressDropdown);
  }

  function saveNewPlace() {
    if (selectedRefId) {
      var editModal = $("#edit-place-modal");
      editModal.modal("hide");
      var title = $("#edit-place-location-title").val();
      var address = $("#edit-place-address").val();
      var instructions = $("#edit-place-instructions").val();
      var update = {
        title: title,
        address: address,
        instructions: instructions
      };
      var uid = login.me();
      console.log(update.toSource());
      console.log(selectedRefId);
      api.postCreatePlace(uid, address, selectedRefId)
        .done(function() {
          api.getPlaceList(uid).done(displayPlaces);
        });
    }
  }

  function newPlaceAction() {
    var editModal = $("#edit-place-modal");
    $("#edit-place-save").one("click", function() {
      saveNewPlace();
      return false;
    });
    emptyEditModal();
    $("#edit-place-address").prop("disabled", false);
    editModal.modal({});
  }

  mod.load = function() {
    api.getPlaceList(login.me()).done(displayPlaces);
    util.afterTyping($("#edit-place-address"), 500, predictAddress);
    $("#new-place-btn").click(newPlaceAction);

    var editModal = $("#edit-place-modal");
    editModal.on("hidden.bs.modal", function() {
      console.log("hidden");
      $("#edit-place-save").off("click");
      //return false;
    });
  };

  return mod;
}());
