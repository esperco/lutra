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

  function viewOfLocationModalDetails(modal, purpose, defaults, teamid,
                                      primaryBtn, cancelBtn, deleteBtn) {
'''
<div #view>
</div>
'''
    if (purpose == "Edit") {
      // TODO: populate with saved values
      deleteBtn.click(function() {
        // TODO: delete location
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      // TODO: save location
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfVideoModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn) {
'''
<div #view>
</div>
'''
    if (purpose == "Edit") {
      // TODO: populate with saved values
      deleteBtn.click(function() {
        // TODO: delete username
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      // TODO: save username
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfPhoneModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn) {
'''
<div #view>
  <select class="phone-type" #select>
    <option value="Mobile">mobile</option>
    <option value="Work">work</option>
    <option value="Home">home</option>
    <option value="Other">other</option>
  </select>
  <input type="text" class="phone-number" size=12/>
  <input type="checkbox" #share>Share</input>
</div>
'''
    if (purpose == "Edit") {
      // TODO: populate with saved values
      deleteBtn.click(function() {
        // TODO: delete phone number
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      // TODO: save phone number
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfWorkplaceModalDetails(modal, purpose, defaults, teamid,
                                       primaryBtn, cancelBtn, deleteBtn) {
'''
<div #view>
</div>
'''
    if (purpose == "Edit") {
      // TODO: populate with saved values
      deleteBtn.click(function() {
        // TODO: delete workplace
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      // TODO: save workplace
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function showInfoModal(type, purpose, defaults, teamid) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog preference-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left"/>
        <div #title class="preference-modal-title"/>
      </div>
      <div #content class="preference-form"/>
      <div class="modal-footer">
        <button #primaryBtn class="button-primary modal-primary"/>
        <button #cancelBtn class="button-secondary modal-cancel">Cancel</button>
        <button #deleteBtn class="button-secondary modal-delete">Delete</button>
      </div>
    </div>
  </div>
</div>
'''
    if (type == "workplace") {
      title.text(purpose + " Workplace");
      content.append(
        viewOfWorkplaceModalDetails(modal, purpose, defaults, teamid,
                                    primaryBtn, cancelBtn, deleteBtn));
    } else if (type == "phone") {
      title.text(purpose + " Phone Number");
      content.append(
        viewOfPhoneModalDetails(modal, purpose, defaults, teamid,
                                primaryBtn, cancelBtn, deleteBtn));
    } else if (type == "video") {
      title.text(purpose + " Username");
      content.append(
        viewOfVideoModalDetails(modal, purpose, defaults, teamid,
                                primaryBtn, cancelBtn, deleteBtn));
    } else if (type == "location") {
      title.text(purpose + " Favorite Location");
      content.append(
        viewOfLocationModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn));
    }

    if (purpose == "Add") {
      primaryBtn.text("Add");
      deleteBtn.css("display", "none");
    } else {
      primaryBtn.text("Update");
    }

    var icon = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/" + type + ".svg");

    (<any> modal).modal({}); // FIXME
  }

  function showWorkplaceModal(purpose, defaults, teamid) {

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
    // TODO: mark selected

    return selector;
  }

  function viewOfInfo(type, label, info, defaults, teamid) {
'''
<li #view>
  <div #editIcon class="img-container-right"/>
  <div #labelText class="semibold"/>
  <div #infoText/>
</li>
'''
    labelText.text(label);
    infoText.text(info);

    var edit = $("<img class='svg-block preference-option-edit'/>")
      .appendTo(editIcon);
    Svg.loadImg(edit, "/assets/img/edit_purple.svg");

    editIcon.hover(function(){
      view.addClass("edit-hover");
      },function(){
      view.removeClass("edit-hover");
    });

    editIcon.click(function() {
      showInfoModal(type, "Edit", defaults, teamid);
    })

    return view;
  }

  function viewOfMealOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #locationContainer class="img-container-left"/>
  <ul #locations class="preference-option-list-container">
    <li><span #addLocation class="link">Add favorite location</span></li>
  </ul>
</div>
'''
    var location = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(locationContainer);
    Svg.loadImg(location, "/assets/img/location.svg");

    locations.append(viewOfInfo("location",
                                "Crepevine",
                                "367 University Ave, Palo Alto, CA 94301",
                                defaults, teamid));

    // TODO: populate locations

    addLocation.click(function() {
      showInfoModal("location", "Add", defaults, teamid);
    })

    return view;
  }

  function viewOfVideoOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #videoContainer class="img-container-left"/>
  <ul #usernames class="preference-option-list-container">
    <li><span #addUsername class="link">Add username</span></li>
  </ul>
</div>
'''
    var video = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(videoContainer);
    Svg.loadImg(video, "/assets/img/video.svg");

    usernames.append(viewOfInfo("video",
                                "Google Hangouts",
                                "john.doe@company.com",
                                defaults, teamid));

    // TODO: populate usernames

    addUsername.click(function() {
      showInfoModal("video", "Add", defaults, teamid);
    })

    return view;
  }

  function viewOfPhoneOptions(defaults, teamid) {
'''
<div #view class="preference-option-row clearfix">
  <div #phoneContainer class="img-container-left"/>
  <ul #numbers class="preference-option-list-container">
    <li><span #addNumber class="link">Add phone number</span></li>
  </ul>
</div>
'''
    var phone = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(phoneContainer);
    Svg.loadImg(phone, "/assets/img/phone.svg");

    numbers.append(viewOfInfo("phone",
                              "Work",
                              "(555) 555-5555",
                              defaults, teamid));

    // TODO: populate phone numbers

    addNumber.click(function() {
      showInfoModal("phone", "Add", defaults, teamid);
    })

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
  <div #details class="workplace-details">
    <div #editIcon class="img-container-right"/>
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

    var edit = $("<img class='svg-block workplace-edit'/>")
      .appendTo(editIcon);
    Svg.loadImg(edit, "/assets/img/edit_white.svg");

    var duration = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(durationContainer);
    Svg.loadImg(duration, "/assets/img/duration.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    editIcon.hover(function(){
      details.addClass("edit-hover");
      },function(){
      details.removeClass("edit-hover");
    });

    editIcon.click(function() {
      showInfoModal("workplace", "Edit", defaults, teamid);
    })

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
<div #addWorkplace class="workplace">
  <div class="new-workplace">
    <div class="add-circle">
      <div class="add-vertical"/>
      <div class="add-horizontal"/>
    </div>
    <div>Add workplace</div>
  </div>
</div>
'''
      workplaces.append(addWorkplace);
      addWorkplace.click(function() {
        showInfoModal("workplace", "Add", initial.workplaces, team.teamid);
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
