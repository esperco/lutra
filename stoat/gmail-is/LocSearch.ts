/*
   Location box typeahead that autocompletes from preferences
   (TODO: use Google API also)
*/

module Esper.LocSearch {

  export function displayResults(team, locationBox, dropdown, query, prefs) {
    var resultsDiv = dropdown;
    resultsDiv.find(".esper-li").remove();
    var locs = Preferences.savedPlaces(prefs);
    var nums = Preferences.contactInfo(team, prefs);
    nums.push("Call GUEST at TBD");
    var hasResult = false;

    List.iter(locs, function(loc) {
      var addr = loc.address.slice(0);
      if (loc.title) addr = loc.title + " - " + addr;
      if (addr.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
        $("<li class='esper-li'>" + addr + "</li>")
          .appendTo(resultsDiv)
          .click(function() {
            locationBox.val(addr);
            Sidebar.dismissDropdowns();
          });
        hasResult = true;
      }
    });

    List.iter(nums, function(num) {
      if (num.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
        $("<li class='esper-li'>" + num + "</li>")
          .appendTo(resultsDiv)
          .click(function() {
            locationBox.val(num);
            Sidebar.dismissDropdowns();
          });
        hasResult = true;
      }
    });

    // With Bootstrap
    if (locationBox.data("toggle") === "dropdown") {
      if (!!hasResult !== !!dropdown.is(":visible")) {
        locationBox.dropdown("toggle");
      }
    }

    // Old non-Bootstrap behavior
    else {
      if (hasResult) {
        if (!(dropdown.hasClass("esper-open"))) dropdown.toggle();
        dropdown.addClass("esper-open");
      } else {
        if (dropdown.hasClass("esper-open")) dropdown.toggle();
        dropdown.removeClass("esper-open");
      }
    }

    // Width adjustment after dropdown visibility change
    dropdown.outerWidth(locationBox.outerWidth());
  }

}
