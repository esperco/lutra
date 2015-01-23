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

  function hourMinute(secs) {
    return {
      hour: Math.floor(secs / 60),
      minute: secs % 60
    };
  }

  function readWorkplace(li) {
    if (li.has("div.add-workplace").length > 0) return null; // skip (+)
    return {
      location: {
        title: li.find(".esper-prefs-workplace-name").text(),
        address: li.find(".esper-prefs-workplace-address").text()
      },
      duration: hourMinute(li.find(".esper-prefs-duration").val()),
      buffer: hourMinute(li.find(".esper-prefs-buffer").val()),
      distance: li.find(".esper-prefs-distance").val(),
      availability: li.find(".esper-prefs-avail").data("availabilities")
    };
  }

  function readPhonePrefs(li) {
    var phoneNumbers = [];
    li.find(".esper-prefs-phone-info").each(function() {
      var num = $(this);
      phoneNumbers.push({
        phone_type: num.find(".esper-info-label").text(),
        phone_number: num.find(".esper-info-value").text(),
        share_with_guests: num.find(".esper-share-phone").is(":checked")
      });
    });
    return {
      duration: hourMinute(li.find(".esper-prefs-duration").val()),
      buffer: hourMinute(li.find(".esper-prefs-buffer").val()),
      available: li.find("div.preference-toggle-switch").hasClass("on"),
      availability: li.find(".esper-prefs-avail").data("availabilities"),
      phones: phoneNumbers
    };
  }

  function readVideoPrefs(li) {
    var videoAccounts = [];
    li.find(".esper-prefs-video-info").each(function() {
      var acct = $(this);
      videoAccounts.push({
        video_type: acct.find(".esper-info-label").text(),
        video_username: acct.find(".esper-info-value").text()
      });
    });
    return {
      duration: hourMinute(li.find(".esper-prefs-duration").val()),
      buffer: hourMinute(li.find(".esper-prefs-buffer").val()),
      available: li.find("div.preference-toggle-switch").hasClass("on"),
      availability: li.find(".esper-prefs-avail").data("availabilities"),
      accounts: videoAccounts
    };
  }

  function readMealPrefs(li) {
    var favoritePlaces = [];
    li.find(".esper-prefs-location-info").each(function() {
      var fav = $(this);
      favoritePlaces.push({
        title: fav.find(".esper-info-label").text(),
        address: fav.find(".esper-info-value").text()
      });
    });
    return {
      duration: hourMinute(li.find(".esper-prefs-duration").val()),
      buffer: hourMinute(li.find(".esper-prefs-buffer").val()),
      available: li.find("div.preference-toggle-switch").hasClass("on"),
      availability: li.find(".esper-prefs-avail").data("availabilities"),
      favorites: favoritePlaces
    };
  }

  function readGeneralPrefs(div) {
    return {
      send_exec_confirmation:
        div.find(".esper-prefs-confirmation").is(":checked"),
      send_exec_reminder:
        div.find(".esper-prefs-reminder").is(":checked"),
      use_duplicate_events:
        div.find(".esper-prefs-duplicate").is(":checked"),
      bcc_exec_on_reply:
        div.find(".esper-prefs-bcc").is(":checked")
    };
  }

  export function currentPreferences() {
    var workplaces = [];
    $(".esper-prefs-workplaces").find("li.workplace").each(function() {
      var workplace = readWorkplace($(this));
      if (workplace !== null) workplaces.push(workplace);
    });

    var transportation = [];
    $(".preference-transportation").each(function() {
      var li = $(this);
      var kids = li.children();
      if (kids.eq(0).hasClass("on"))
        transportation.push(kids.eq(1).text());
    });

    var meeting_types = {};
    meeting_types["phone_call"] =
      readPhonePrefs($(".esper-prefs-phone").eq(0));
    meeting_types["video_call"] =
      readVideoPrefs($(".esper-prefs-video").eq(0));
    Preferences.meals.forEach(function(meal) {
      meeting_types[meal] = readMealPrefs($(".esper-prefs-" + meal).eq(0));
    });

    var general = readGeneralPrefs($(".esper-prefs-general").eq(0));

    var notes = $(".preferences-notes").val();

    return {
      workplaces: workplaces,
      transportation: transportation,
      meeting_types: meeting_types,
      general: general,
      notes: notes
    };
  }

  export function savePreferences() {
    var teamid = $(".esper-prefs-teamid").val();
    var preferences = currentPreferences();
    Api.setPreferences(teamid, preferences)
      .done(function() {
        Log.p("Preferences saved.");
      });
  }

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
      divider.css("height", rows * 404 + "px");
    } else {
      divider.css("height", rows * 270 + "px");
    }
  }

  function viewOfLocationModalDetails(modal, purpose, defaults, teamid,
                                      primaryBtn, cancelBtn, deleteBtn,
                                      viewToUpdate) {
'''
<div #view>
  <div class="semibold">Location Name</div>
  <input #name class="preference-input" type="text"/>
  <div class="semibold">Address</div>
  <input #address class="preference-input" type="text"/>
</div>
'''
    if (purpose == "Edit") {
      name.val(defaults.title);
      address.val(defaults.address);
      deleteBtn.click(function() {
        viewToUpdate.remove();
        savePreferences();
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      defaults.title = name.val();
      defaults.address = address.val();
      var newView = viewOfInfo("location",
                               name.val(),
                               address.val(),
                               defaults, teamid);
      if (purpose === "Edit")
        viewToUpdate.replaceWith(newView);
      else
        viewToUpdate.append(newView);
      savePreferences();
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfVideoModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn,
                                   viewToUpdate) {
'''
<div #view>
  <div class="semibold">Service</div>
  <div class="clearfix">
    <select class="username-type esper-select" #select>
      <option value="Google">Google Hangouts</option>
      <option value="Skype">Skype</option>
      <option value="Other">Other</option>
    </select>
  </div>
  <div class="semibold">Username</div>
  <input #username type="text" class="preference-input" size=12/>
</div>
'''
    if (purpose == "Edit") {
      select.children().each(function() {
        if ($(this).val() === defaults.video_type)
          $(this).prop("selected", true);
      });
      username.val(defaults.video_username);
      deleteBtn.click(function() {
        viewToUpdate.remove();
        savePreferences();
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      defaults.video_type = select.val();
      defaults.video_username = username.val();
      var newView = viewOfInfo("video",
                               select.val(),
                               username.val(),
                               defaults, teamid);
      if (purpose === "Edit")
        viewToUpdate.replaceWith(newView);
      else
        viewToUpdate.append(newView);
      savePreferences();
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfPhoneModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn,
                                   viewToUpdate) {
'''
<div #view>
  <div class="semibold">Type</div>
  <div class="clearfix">
    <select class="phone-type esper-select" #select>
      <option value="Mobile">Mobile</option>
      <option value="Work">Work</option>
      <option value="Home">Home</option>
      <option value="Other">Other</option>
    </select>
  </div>
  <div class="semibold">Phone Number</div>
  <input #number type="text" class="preference-input phone-input" size="12"/>
  <div class="share-number">
    <input type="checkbox" #share/>
    <span>Share this number with guests you meet in person</span>
  </div>
</div>
'''
    if (purpose == "Edit") {
      select.children().each(function() {
        if ($(this).val() === defaults.phone_type)
          $(this).prop("selected", true);
      });
      number.val(defaults.phone_number);
      if (defaults.share_with_guests)
        share.prop("checked", true);
      deleteBtn.click(function() {
        viewToUpdate.remove();
        savePreferences();
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      defaults.phone_type = select.val();
      defaults.phone_number = number.val();
      defaults.share_with_guests = share.is(":checked");
      var newView = viewOfInfo("phone",
                               select.val(),
                               number.val(),
                               defaults, teamid);
      if (purpose === "Edit")
        viewToUpdate.replaceWith(newView);
      else
        viewToUpdate.append(newView);
      savePreferences();
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function viewOfWorkplaceModalDetails(modal, purpose, defaults, teamid,
                                       primaryBtn, cancelBtn, deleteBtn,
                                       viewToUpdate) {
'''
<div #view>
  <div class="semibold">Workplace Name</div>
  <input #name class="preference-input" type="text"/>
  <div class="semibold">Address</div>
  <input #address class="preference-input" type="text"/>
</div>
'''
    if (purpose == "Edit") {
      name.val(defaults.location.title);
      address.val(defaults.location.address);
      deleteBtn.click(function() {
        viewToUpdate.remove();
        savePreferences();
        (<any> modal).modal("hide"); // FIXME
      });
    }

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    primaryBtn.click(function() {
      if (defaults.location === undefined)
        defaults = Preferences.defaultPreferences().workplaces[0];
      defaults.location.title = name.val();
      defaults.location.address = address.val();
      var newView = viewOfWorkplace(defaults, teamid);
      if (purpose === "Edit")
        viewToUpdate.replaceWith(newView);
      else
        viewToUpdate.append(newView);
      savePreferences();
      (<any> modal).modal("hide"); // FIXME
    });

    return view;
  }

  function showInfoModal(type, purpose, defaults, teamid, view) {
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
                                    primaryBtn, cancelBtn, deleteBtn, view));
    } else if (type == "phone") {
      title.text(purpose + " Phone Number");
      content.append(
        viewOfPhoneModalDetails(modal, purpose, defaults, teamid,
                                primaryBtn, cancelBtn, deleteBtn, view));
    } else if (type == "video") {
      title.text(purpose + " Username");
      content.append(
        viewOfVideoModalDetails(modal, purpose, defaults, teamid,
                                primaryBtn, cancelBtn, deleteBtn, view));
    } else if (type == "location") {
      title.text(purpose + " Favorite Location");
      content.append(
        viewOfLocationModalDetails(modal, purpose, defaults, teamid,
                                   primaryBtn, cancelBtn, deleteBtn, view));
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
<select #selector
    class="preference-option-selector esper-select esper-prefs-duration">
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
    selector.change(savePreferences);
    return selector;
  }

  function createBufferSelector(selected) {
'''
<select #selector
    class="preference-option-selector esper-select esper-prefs-buffer">
  <option value="0">None</option>
  <option value="5">5 min</option>
  <option value="10">10 min</option>
  <option #initial value="15">15 min</option>
  <option value="20">20 min</option>
  <option value="30">30 min</option>
  <option value="45">45 min</option>
  <option value="60">1 hr</option>
</select>
'''
    if (selected === undefined) {
      initial.prop("selected", true);
    } else {
      var selectedMinutes = selected.hour * 60 + selected.minute;
      selector.children().each(function() {
        if (Number($(this).val()) === selectedMinutes)
          $(this).prop("selected", true);
      });
    }
    selector.change(savePreferences);
    return selector;
  }

  function viewOfInfo(type, label, info, defaults, teamid) {
'''
<li #view>
  <div #editIcon class="img-container-right preference-option-edit"/>
  <div #infoContainer class="preference-info">
    <div #labelText class="semibold esper-info-label"/>
    <div #infoText class="esper-info-value"/>
  </div>
</li>
'''
    labelText.text(label);
    infoText.text(info);
    if (type === "phone") {
      $("<input type='checkbox' class='esper-share-phone'/>")
        .prop("checked", defaults.share_with_guests)
        .hide()
        .appendTo(infoContainer);
    }

    var edit = $("<img class='svg-block'/>")
      .appendTo(editIcon);
    Svg.loadImg(edit, "/assets/img/edit_purple.svg");

    editIcon.hover(function(){
      infoContainer.addClass("edit-hover");
      },function(){
      infoContainer.removeClass("edit-hover");
    });

    var defaultsCopy = $.extend(true, {}, defaults);
    editIcon.click(function() {
      showInfoModal(type, "Edit", defaultsCopy, teamid, view);
    })

    view.addClass("esper-prefs-" + type + "-info");
    return view;
  }

  function viewOfMealOptions(defaults : ApiT.MealInfo, teamid) {
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
                                  fav, teamid));
    });

    addLocation.click(function() {
      showInfoModal("location", "Add", defaults, teamid, locations);
    })

    return view;
  }

  function viewOfVideoOptions(defaults : ApiT.VideoInfo, teamid) {
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
                                  acct, teamid));
    });

    addUsername.click(function() {
      showInfoModal("video", "Add", defaults, teamid, usernames);
    })

    return view;
  }

  function viewOfPhoneOptions(defaults : ApiT.PhoneInfo, teamid) {
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
                                ph, teamid));
    });

    addNumber.click(function() {
      showInfoModal("phone", "Add", defaults, teamid, numbers);
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
    <div #timeRow class="preference-option-selector-row clearfix">
      <div #durationCol class="preference-option-col clearfix">
        <div class="preference-option-title semibold">Duration</div>
        <div #durationContainer class="img-container-left"/>
      </div>
      <div #bufferCol class="preference-option-col clearfix">
        <div class="preference-option-title semibold clearfix">
          <span class="info-title">Buffer time</span>
          <div #bufferInfo
               data-toggle="tooltip"
               data-placement="top"
               title="Maximum extra time"
               class="img-container-left buffer-tooltip"/>
        </div>
        <div #bufferContainer class="img-container-left"/>
      </div>
    </div>
    <div class="preference-option-row clearfix">
      <div #availabilityContainer class="img-container-left"/>
      <div #customizeAvailability
          class="esper-prefs-avail link preference-option-link">
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

    var buffer = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(bufferContainer);
    Svg.loadImg(buffer, "/assets/img/buffer.svg");

    var bufferInfoIcon = $("<img class='svg-block info-icon'/>")
      .appendTo(bufferInfo);
    Svg.loadImg(bufferInfoIcon, "/assets/img/info.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    durationCol.append(createDurationSelector(defaults.duration));
    bufferCol.append(createBufferSelector(defaults.buffer));

    bufferInfo.tooltip();

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
    toggle.click(function() {
      togglePreference(_view, teamid, undefined);
      savePreferences();
    });

    view.addClass("esper-prefs-" + type);
    return view;
  }

  function viewOfTransportationType(type,
                                    defaults : string[],
                                    teamid) {
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
    var lowerType = type.charAt(0).toLowerCase() + type.slice(1);

    var icon = $("<img class='svg-block preference-transportation-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/" + lowerType + ".svg");

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
      if (transportation.hasClass("on"))
        disable();
      else
        enable();
      savePreferences();
    });

    return view;
  }

  function createDistanceSelector(selected) {
'''
<select #selector
    class="preference-option-selector esper-select esper-prefs-distance">
  <option value="0">0 miles</option>
  <option value="1">1 mile</option>
  <option value="2">2 miles</option>
  <option value="3">3 miles</option>
  <option value="5">5 miles</option>
  <option value="10">10 miles</option>
  <option value="15">15 miles</option>
  <option value="20">20 miles</option>
  <option value="30">30+ miles</option>
</select>
'''
    selector.children().each(function() {
      if (Number($(this).val()) === selected)
        $(this).prop("selected", true);
    });
    selector.change(savePreferences);
    return selector;
  }

  function viewOfWorkplace(defaults : ApiT.Workplace, teamid) {
'''
<li #view class="workplace">
  <img src="/assets/img/workplace-map.png" class="workplace-map"/>
  <div #details class="workplace-details">
    <div #editIcon class="img-container-right"/>
    <div #title class="esper-prefs-workplace-name semibold"/>
    <div #address class="esper-prefs-workplace-address"/>
  </div>
  <div #options class="workplace-options">
    <div #help class="gray"/>
    <div #timeRow class="preference-option-selector-row clearfix">
      <div #durationCol class="preference-option-col clearfix">
        <div class="preference-option-title semibold">Duration</div>
        <div #durationContainer class="img-container-left"/>
      </div>
      <div #bufferCol class="preference-option-col clearfix">
        <div class="preference-option-title semibold clearfix">
          <span class="info-title">Buffer time</span>
          <div #bufferInfo
               data-toggle="tooltip"
               data-placement="top"
               title="Maximum extra time"
               class="img-container-left buffer-tooltip"/>
        </div>
        <div #bufferContainer class="img-container-left"/>
      </div>
    </div>
    <div #distanceRow class="preference-option-selector-row clearfix">
      <div class="preference-option-title semibold clearfix">
        <span class="info-title">Distance</span>
        <div #distanceInfo
             data-toggle="tooltip"
             data-placement="right"
             title="How far away are you willing to meet when based at this Workplace?"
             class="img-container-left distance-tooltip"/>
      </div>
      <div #distanceContainer class="img-container-left"/>
    </div>
    <div class="preference-option-row clearfix">
      <div #availabilityContainer class="img-container-left"/>
      <div #customizeAvailability
           class="esper-prefs-avail link preference-option-link">
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

    var buffer = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(bufferContainer);
    Svg.loadImg(buffer, "/assets/img/buffer.svg");

    var bufferInfoIcon = $("<img class='svg-block info-icon'/>")
      .appendTo(bufferInfo);
    Svg.loadImg(bufferInfoIcon, "/assets/img/info.svg");

    var distance = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(distanceContainer);
    Svg.loadImg(distance, "/assets/img/distance.svg");

    var distanceInfoIcon = $("<img class='svg-block info-icon'/>")
      .appendTo(distanceInfo);
    Svg.loadImg(distanceInfoIcon, "/assets/img/info.svg");

    var availability = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(availabilityContainer);
    Svg.loadImg(availability, "/assets/img/availability.svg");

    editIcon.hover(function(){
      details.addClass("edit-hover");
      },function(){
      details.removeClass("edit-hover");
    });

    var defaultsCopy = $.extend(true, {}, defaults);
    editIcon.click(function() {
      showInfoModal("workplace", "Edit", defaultsCopy, teamid, view);
    })

    durationCol.append(createDurationSelector(defaults.duration));
    bufferCol.append(createBufferSelector(defaults.buffer));

    bufferInfo.tooltip();

    distanceRow.append(createDistanceSelector(defaults.distance));

    distanceInfo.tooltip();

    customizeAvailability.data("availabilities", defaults.availability);
    customizeAvailability.click(function() {
      showAvailability("Meetings at " + name, defaults, customizeAvailability);
    });

    return view;
  }

  function viewOfGeneralPrefs(general : ApiT.GeneralPrefs,
                              team : ApiT.Team) {
'''
  <div #view class="preference esper-prefs-general">
    <ul>
      <li>
        <input #sendConfirmation type="checkbox"
               class="esper-prefs-confirmation"/>
        Send confirmation emails to executive
      </li>
      <li>
        <input #sendReminder type="checkbox"
               class="esper-prefs-reminder"/>
        Send reminder emails to executive
      </li>
      <li>
        <input #useDuplicate type="checkbox" checked="checked"
               class="esper-prefs-duplicate"/>
        Use duplicate calendar events to invite guests
      </li>
      <li>
        <input #bccExec type="checkbox" checked="checked"
               class="esper-prefs-bcc"/>
        Bcc exec on first email to guests
      </li>
    </ul>
  </div>
'''
    if (general !== undefined) {
      if (general.send_exec_confirmation)
        sendConfirmation.prop("checked", true);
      if (general.send_exec_reminder)
        sendReminder.prop("checked", true);
      if (!general.use_duplicate_events)
        useDuplicate.prop("checked", false);
      if (!general.bcc_exec_on_reply)
        bccExec.prop("checked", false);
    }

    sendConfirmation.click(savePreferences);
    sendReminder.click(savePreferences);
    useDuplicate.click(savePreferences);
    bccExec.click(savePreferences);

    return view;
  }

  export function load(team) {
'''
<div #view>
  <div class="table-header">Workplaces</div>
  <ul #workplaces class="table-list esper-prefs-workplaces">
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
  <div class="table-header">General Scheduling</div>
  <div #general class="table-list"/>
  <div class="table-header">Notes</div>
  <textarea #notes
            rows=5
            placeholder="Leave additional notes here"
            class="preferences-notes">
  </textarea>
  <div class="save-notes-bar">
    <button #saveNotes class="button-primary" disabled>Save</button>
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
        showInfoModal(
          "workplace", "Add", initial.workplaces, team.teamid, workplaces);
      });
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

      general.append(viewOfGeneralPrefs(initial.general, team));

      notes.val(initial.notes);
      Util.afterTyping(notes, 250, function() {
        saveNotes.prop("disabled", false);
      });
      saveNotes.click(function() {
        savePreferences();
        saveNotes.prop("disabled", true);
      });
    }; // end sub-function loadPreferences

    Api.getPreferences(team.teamid).done(function(prefs) {
      loadPreferences(
        $.extend(true, Preferences.defaultPreferences(), prefs));
    });

    $("<input type='hidden' class='esper-prefs-teamid'/>")
      .val(team.teamid)
      .appendTo(view);

    return view;
  }

}
