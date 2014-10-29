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

  function togglePreference(view, teamid, forceState) {
    if (forceState === false || view.toggleBg.hasClass("on")) {
      view.toggleBg.removeClass("on");
      view.toggleBg.addClass("off");
      view.toggleSwitch.removeClass("on");
      view.toggleSwitch.addClass("off");
      view.title.addClass("off");
      view.options.addClass("unselectable off");
    } else {
      view.toggleBg.addClass("on");
      view.toggleBg.removeClass("off");
      view.toggleSwitch.addClass("on");
      view.toggleSwitch.removeClass("off");
      view.title.removeClass("off");
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
  <div class="semibold">Location Name</div>
  <input #name class="preference-input" type="text"/>
  <div class="semibold">Address</div>
  <input #address class="preference-input" type="text"/>
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
  <div class="semibold">Service</div>
  <select class="username-type" #select>
    <option value="Google">Google Hangouts</option>
    <option value="Skype">Skype</option>
    <option value="Other">Other</option>
  </select>
  <div class="semibold">Username</div>
  <input type="text" class="preference-input" size=12/>
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
  <div class="semibold">Type</div>
  <select class="phone-type" #select>
    <option value="Mobile">Mobile</option>
    <option value="Work">Work</option>
    <option value="Home">Home</option>
    <option value="Other">Other</option>
  </select>
  <div class="semibold">Phone Number</div>
  <input type="text" class="preference-input" size="12"/>
  <div class="share-number">
    <input type="checkbox" #share/>
    <span>Share this number with guests you meet in person</span>
  </div>
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
  <div class="semibold">Workplace Name</div>
  <input #name class="preference-input" type="text"/>
  <div class="semibold">Address</div>
  <input #address class="preference-input" type="text"/>
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
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title"/>
      </div>
      <div #content class="preference-form"/>
      <div class="modal-footer">
        <button #primaryBtn class="button-primary modal-primary" disabled/>
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

  function showAvailability(name, defaults, element) {
    CalPicker.createModal(name, defaults, element);
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
    var selectedMinutes = selected.hour * 60 + selected.minute;
    selector.children().each(function() {
      if (Number($(this).val()) === selectedMinutes)
        $(this).prop("selected", true);
    });
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

    List.iter(defaults.favorites, function(fav) {
      locations.append(viewOfInfo("location",
                                  fav.title,
                                  fav.address,
                                  defaults, teamid));
    });

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

    List.iter(defaults.accounts, function(acct) {
      usernames.append(viewOfInfo("video",
                                  acct.video_type,
                                  acct.video_username,
                                  defaults, teamid));
    });

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

    List.iter(defaults.phones, function(ph) {
      numbers.append(viewOfInfo("phone",
                                ph.phone_type,
                                ph.phone_number,
                                defaults, teamid));
    });

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
    <div #durationRow class="preference-option-selector-row clearfix">
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
    var name = type.charAt(0).toUpperCase() + type.slice(1);
    title.text(name);

    var duration = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(durationContainer);
    Svg.loadImg(duration, "/assets/img/duration.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    durationRow.append(createDurationSelector(defaults.duration));

    customizeAvailability.data("availabilities", defaults.availability);

    if (type == "phone") {
      customizeAvailability.click(function() {
        showAvailability(name + " Calls", defaults, customizeAvailability);
      });
      options.append(viewOfPhoneOptions(defaults, teamid));
    } else if (type == "video") {
      customizeAvailability.click(function() {
        showAvailability(name + " Calls", defaults, customizeAvailability);
      });
      options.append(viewOfVideoOptions(defaults, teamid));
    } else {
      customizeAvailability.click(function() {
        showAvailability(name, defaults, customizeAvailability);
      });
      options.append(viewOfMealOptions(defaults, teamid));
    }

    if (defaults.available === false) togglePreference(_view, teamid, false);
    toggle.click(function() { togglePreference(_view, teamid, undefined) });

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
    title.text(type);

    var icon = $("<img class='svg-block preference-transportation-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/" + type + ".svg");

    var check = $("<img class='svg-block preference-transportation-check'/>")
      .appendTo(checkContainer);
    Svg.loadImg(check, "/assets/img/check.svg");

    function enable() {
      transportation.removeClass("off");
      transportation.addClass("on");
    }

    function disable() {
      transportation.removeClass("on");
      transportation.addClass("off");
    }

    if (List.mem(defaults, type)) enable();
    else disable();

    transportation.click(function() {
      if (transportation.hasClass("on")) {
        disable();
        // TODO: update preferences
      } else {
        enable();
        // TODO: update preferences
      }
    });

    return view;
  }

  function viewOfWorkplace(defaults, teamid) {
'''
<li #view class="workplace">
  <img src="/assets/img/workplace-map.png" class="workplace-map"/>
  <div #details class="workplace-details">
    <div #editIcon class="img-container-right"/>
    <div #title class="workplace-name semibold"/>
    <div #address/>
  </div>
  <div #options class="workplace-options">
    <div #help class="gray"/>
    <div #durationRow class="preference-option-selector-row clearfix">
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
    var name = defaults.location.title;
    title.text(name);
    address.text(defaults.location.address);

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
      showAvailability("Meetings at " + name, defaults, customizeAvailability);
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
        workplaces.append(viewOfWorkplace(place, team.teamid));
      });
'''
<li #addWorkplace class="workplace">
  <div #addBtn class="add-workplace">
    <div class="add-circle">
      <div class="add-vertical"/>
      <div class="add-horizontal"/>
    </div>
    <div>Add workplace</div>
  </div>
</li>
'''
      workplaces.append(addWorkplace);
      addBtn.click(function() {
        showInfoModal("workplace", "Add", initial.workplaces, team.teamid);
      })
      setDividerHeight(
        "workplace",
        workplacesDivider,
        Math.round((initial.workplaces.length + 1)/2));

      Preferences.transportationTypes.map(function (type) {
          return viewOfTransportationType(
            type, initial.transportation, team.teamid);
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
