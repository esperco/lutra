/*
  Team Settings - Preferences Tab
*/

module PreferencesTab {

  function toggleOverlay(overlay) {
    if (overlay.css("display") === "none")
      overlay.css("display", "inline-block");
    else
      overlay.css("display", "none");
  }

  function dismissOverlays() {
    $(".overlay-list").css("display", "none");
    $(".overlay-popover").css("display", "none");
    $(".overlay-popover input").val("");
    $(".overlay-popover .new-label-error").hide();
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("click-safe"))
      dismissOverlays();
  });

  function togglePreference(view, teamid) {
    if (view.toggleBg.hasClass("on")) {
      view.toggleBg.removeClass("on");
      view.toggleBg.addClass("off");
      view.toggleSwitch.removeClass("on");
      view.toggleSwitch.addClass("off");
      view.title.css("text-decoration", "line-through");
      view.options.addClass("unselectable off");
    } else {
      view.toggleBg.addClass("on");
      view.toggleBg.removeClass("off");
      view.toggleSwitch.addClass("on");
      view.toggleSwitch.removeClass("off");
      view.title.css("text-decoration", "none");
      view.options.removeClass("unselectable off");
    }
  }

  function setDividerHeight(category, divider, rows) {
    if (category == "workplace") {
      divider.css("height", rows * 315 + "px");
    } else {
      divider.css("height", rows * 236 + "px");
    }
  }

//   function addNewLocation(defaults, element) : void {
// '''
// <div #modal
//      class="modal fade" tabindex="-1"
//      role="dialog">
//   <div class="modal-dialog team-settings">
//     <div class="modal-content">
//       <div class="modal-header">Customize Availability</div>
//       <div #content></div>
//       <div class="modal-footer">
//         <button #save class="button-primary">Save</button>
//       </div>
//     </div>
//   </div>
// </div>
// '''
//     var availabilities = defaults.availability;
//     var picker = createPicker(availabilities);
//     content.append(picker.view);

//     (<any> modal).modal({}); // FIXME
//     setTimeout(function() { render(picker); }, 320); // Wait for fade

//     save.click(function() {
//       var events = [];
//       for (var k in picker.events)
//         events = events.concat(makeAvailability(picker.events[k]));

//       element.data("availabilities", events); // ughgh pass data through DOM
//       defaults.availability = events;

//       (<any> modal).modal("hide"); // FIXME
//     });
//   }

  function showEditLocation() {

  }

  function showAddLocation() {

  }

  function showEditUsername() {

  }

  function showAddUsername() {

  }

  function showEditNumber() {

  }

  function showAddNumber() {

  }

  function showEditWorkplace() {

  }

  function showAddWorkplace() {

  }

  function showAvailability(defaults, element) {
    CalPicker.createModal(defaults, element);
  }

  function createDurationSelector(selected) {
'''
<select #selector class="preference-option-selector">
  <option #dur10 value="10">10 min</option>
  <option #dur15 value="15">15 min</option>
  <option #dur20 value="20">20 min</option>
  <option #dur30 value="30">30 min</option>
  <option #dur45 value="45">45 min</option>
  <option #dur60 value="60">1 hr</option>
  <option #dur90 value="90">1 hr 30 min</option>
  <option #dur120 value="120">2 hr</option>
  <option #dur150 value="150">2 hr 30 min</option>
  <option #dur180 value="180">3 hr</option>
</select>
'''

    return selector;
  }

  function viewOfMealOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #locationContainer class="img-container-left"/>
  <ul #locations class="preference-option-list-container">
    <li #example>
      <div class="semibold">Crepevine</div>
      <div>367 University Ave, Palo Alto, CA 94301</div>
    </li>
    <li #addLocation class="link">
      Add favorite location
    </li>
  </ul>
</div>
'''
    var location = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(locationContainer);
    Svg.loadImg(location, "/assets/img/location.svg");

    addLocation.click();

    return view;
  }

  function viewOfVideoOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #videoContainer class="img-container-left"/>
  <ul #usernames class="preference-option-list-container">
    <li #example>
      <div class="semibold">Google Hangouts</div>
      <div>john.doe@company.com</div>
    </li>
    <li #addUsername class="link">
      Add username
    </li>
  </ul>
</div>
'''
    var video = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(videoContainer);
    Svg.loadImg(video, "/assets/img/video.svg");

    return view;
  }

  function viewOfPhoneOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #phoneContainer class="img-container-left"/>
  <ul #numbers class="preference-option-list-container">
    <li #example>
      <div class="semibold">Work</div>
      <div>(555) 555-5555</div>
    </li>
    <li #addNumber class="link">
      Add phone number
    </li>
  </ul>
</div>
'''
    var phone = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(phoneContainer);
    Svg.loadImg(phone, "/assets/img/phone.svg");

    addNumber.click(function() {showAddNumber})

    return view;
  }

  function viewOfMeetingType(type, defaults, teamid) {
'''
<li #view class="preference">
  <div #toggle>
    <div #toggleBg class="preference-toggle-bg on"/>
    <div #toggleSwitch class="preference-toggle-switch on"/>
  </div>
  <div #title class="preference-title semibold"/>
  <hr/>
  <div #options class="preference-options">
    <div #durationRow class="preference-option-row clearfix">
      <div #durationContainer class="img-container-left"/>
    </div>
    <div class="preference-option-row clearfix">
      <div #availabilityContainer class="img-container-left"/>
      <div #customizeAvailability class="link preference-option-link">
        Customize availability
      </div>
    </div>
  </div>
</li>
'''
    title.text(type.charAt(0).toUpperCase() + type.slice(1));

    var duration = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(durationContainer);
    Svg.loadImg(duration, "/assets/img/duration.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    durationRow.append(createDurationSelector(defaults.duration));

    if (type == "phone") {
      options.append(viewOfPhoneOptions(defaults, teamid));
    } else if (type == "video") {
      options.append(viewOfVideoOptions(defaults, teamid));
    } else {
      options.append(viewOfMealOptions(defaults, teamid));
    }

    toggle.click(function() { togglePreference(_view, teamid) });

    customizeAvailability.data("availabilities", defaults.availability);
    customizeAvailability.click(function() {
      showAvailability(defaults, customizeAvailability);
    });

    return view;
  }

  function viewOfTransportationType(type, defaults, teamid) {
'''
<li #view class="preference-transportation">
  <div #transportation class="preference-transportation-button on">
    <div #checkContainer/>
    <div #iconContainer/>
  </div>
  <div #title/>
</li>
'''
    title.text(type.charAt(0).toUpperCase() + type.slice(1));

    var icon = $("<img class='svg-block preference-transportation-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/" + type + ".svg");

    var check = $("<img class='svg-block preference-transportation-check'/>")
      .appendTo(checkContainer);
    Svg.loadImg(check, "/assets/img/check.svg");

    // TODO: mark transportation as on or off based on defaults

    transportation.click(function() {
      if (transportation.hasClass("on")) {
        transportation.removeClass("on");
        transportation.addClass("off");
        // TODO: update preferences
      } else {
        transportation.removeClass("off");
        transportation.addClass("on");
        // TODO: update preferences
      }
    });

    return view;
  }

  function viewOfWorkplace(name, defaults, teamid) {
'''
<li #view class="workplace">
  <img src="/assets/img/workplace-map.png" class="workplace-map"/>
  <div class="workplace-details">
    <div #title class="workplace-name semibold"/>
    <div #address>435 Tasso St. #315, Palo Alto, CA 94301</div>
  </div>
  <div #options class="workplace-options">
    <div #help class="gray"/>
    <div #durationRow class="preference-option-row clearfix">
      <div #durationContainer class="img-container-left"/>
    </div>
    <div class="preference-option-row clearfix">
      <div #availabilityContainer class="img-container-left"/>
      <div #customizeAvailability class="link preference-option-link">
        Customize availability
      </div>
    </div>
  </div>
</li>
'''
    title.text(name);

    help.text("Specify preferences for in-person meetings at this location.");

    var duration = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(durationContainer);
    Svg.loadImg(duration, "/assets/img/duration.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    durationRow.append(createDurationSelector(defaults.duration));

    customizeAvailability.data("availabilities", defaults.availability);
    customizeAvailability.click(function() {
      showAvailability(defaults, customizeAvailability);
    });

    return view;
  }

  export function load(team) {
'''
<div #view>
  <div class="table-header">Workplaces</div>
  <ul #workplaces class="table-list">
    <div #workplacesDivider class="table-divider"/>
  </ul>
  <div class="table-header">Transportation</div>
  <ul #transportationTypes class="table-list transportation-table"/>
  <div class="table-header">Calls</div>
  <ul #calls class="table-list">
    <div #callsDivider class="table-divider"/>
  </ul>
  <div class="table-header">Food & Drinks</div>
  <ul #meals class="table-list">
    <div #mealsDivider class="table-divider"/>
  </ul>
  <div class="table-header">Notes</div>
  <textarea #notes
            rows=5
            placeholder="Leave additional notes here"
            class="preferences-notes">
  </textarea>
  <div class="save-notes-bar">
    <button #save-notes class="button-primary" disabled>Save</button>
  </div>
</div>
'''

    function loadPreferences(initial) {
      initial.workplaces.forEach(function (place) {
        workplaces.append(viewOfWorkplace("Example", place, team.teamid));
      });
'''
<div #newWorkplace class="workplace">
  <div class="new-workplace">
    <div class="add-circle">
      <div class="add-vertical"/>
      <div class="add-horizontal"/>
    </div>
    <div>Add workplace</div>
  </div>
</div>
'''
      workplaces.append(newWorkplace);
      newWorkplace.click(function() {
        // new workplace modal
      })
      setDividerHeight(
        "workplace",
        workplacesDivider,
        Math.round((initial.workplaces.length + 1)/2));

      Preferences.transportationTypes.map(function (transportation) {
          return viewOfTransportationType(
            transportation, initial.meeting_types.phone_call, team.teamid);
        }).forEach(function (element) {
          transportationTypes.append(element);
        });

      calls
        .append(viewOfMeetingType(
          "phone", initial.meeting_types.phone_call, team.teamid))
        .append(viewOfMeetingType(
          "video", initial.meeting_types.video_call, team.teamid));
      setDividerHeight("calls", callsDivider, 1);

      Preferences.meals.map(function (meal) {
          return viewOfMeetingType(
            meal, initial.meeting_types[meal], team.teamid);
        }).forEach(function (element) {
          meals.append(element);
        });
      setDividerHeight("meals", mealsDivider, 3);

      notes.val(initial.notes);
    };

    var preferences = Api.getPreferences(team.teamid)
      .done(function(x) {
        Log.p("PREFERENCES", x);
        loadPreferences($.extend(true, Preferences.defaultPreferences(), x));
      });

    return view;
  }

}
