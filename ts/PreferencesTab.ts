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

  function readEmailPrefs(li) {
    var sendTo = [];
    li.find(".esper-preference-check").each(function() {
      var email = $(this);
      if (email.find(".esper-prefs-email").prop("checked")) {
        sendTo.push(email.text().trim());
      }
    });
    return {
      enabled: li.find("div.preference-toggle-switch").hasClass("on"),
      recipients: sendTo
    }
  }

  function readGeneralPrefs(div) {
    var colorBox =
      $(".esper-prefs-hold-color").is(":checked") ?
      $(".esper-event-color-selected") :
      undefined;
    return {
      send_exec_confirmation:
        div.find(".esper-prefs-confirmation").is(":checked"),
      send_exec_reminder:
        div.find(".esper-prefs-reminder").is(":checked"),
      use_duplicate_events:
        div.find(".esper-prefs-duplicate").is(":checked"),
      bcc_exec_on_reply:
        div.find(".esper-prefs-bcc").is(":checked"),
      current_timezone:
        div.find(".esper-prefs-timezone").val(),
      hold_event_color: (
        colorBox ?
        { key: colorBox.data("key"), color: colorBox.data("color") } :
        undefined
      )
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

    var email_types = {};
    email_types["daily_agenda"] =
      readEmailPrefs($(".esper-prefs-daily-agenda").eq(0));
    email_types["tasks_update"] =
      readEmailPrefs($(".esper-prefs-tasks-update").eq(0));

    var general = readGeneralPrefs($(".esper-prefs-general").eq(0));

    var coworkers = $(".coworkers-textbox").val();
    var notes = $(".preferences-notes").val();

    return {
      workplaces: workplaces,
      transportation: transportation,
      meeting_types: meeting_types,
      email_types: email_types,
      general: general,
      coworkers: coworkers,
      notes: notes
    };
  }

  export function savePreferences() {
    var teamid = $(".esper-prefs-teamid").val();
    var preferences = currentPreferences();
    Api.setPreferences(teamid, preferences)
      .done(function() {
        Log.d("Preferences saved.");
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

  function createTimezoneSelector(selected) {
'''
<select #currentTimezone
    class="esper-select esper-prefs-timezone">
  <option value="US/Pacific">US/Pacific</option>
  <option value="US/Mountain">US/Mountain</option>
  <option value="US/Central">US/Central</option>
  <option value="US/Eastern">US/Eastern</option>
  <option disabled>────────────────────</option>
  <option value="Pacific/Midway">(GMT-11:00) Midway</option>
  <option value="Pacific/Niue">(GMT-11:00) Niue</option>
  <option value="Pacific/Pago_Pago">(GMT-11:00) Pago Pago</option>
  <option value="Pacific/Honolulu">(GMT-10:00) Hawaii Time</option>
  <option value="Pacific/Rarotonga">(GMT-10:00) Rarotonga</option>
  <option value="Pacific/Tahiti">(GMT-10:00) Tahiti</option>
  <option value="Pacific/Marquesas">(GMT-09:30) Marquesas</option>
  <option value="America/Anchorage">(GMT-09:00) Alaska Time</option>
  <option value="Pacific/Gambier">(GMT-09:00) Gambier</option>
  <option value="America/Los_Angeles">(GMT-08:00) Pacific Time</option>
  <option value="America/Tijuana">(GMT-08:00) Pacific Time - Tijuana</option>
  <option value="America/Vancouver">(GMT-08:00) Pacific Time - Vancouver</option>
  <option value="America/Whitehorse">(GMT-08:00) Pacific Time - Whitehorse</option>
  <option value="Pacific/Pitcairn">(GMT-08:00) Pitcairn</option>
  <option value="America/Dawson_Creek">(GMT-07:00) Mountain Time - Dawson Creek</option>
  <option value="America/Denver">(GMT-07:00) Mountain Time</option>
  <option value="America/Edmonton">(GMT-07:00) Mountain Time - Edmonton</option>
  <option value="America/Hermosillo">(GMT-07:00) Mountain Time - Hermosillo</option>
  <option value="America/Mazatlan">(GMT-07:00) Mountain Time - Chihuahua, Mazatlan</option>
  <option value="America/Phoenix">(GMT-07:00) Mountain Time - Arizona</option>
  <option value="America/Yellowknife">(GMT-07:00) Mountain Time - Yellowknife</option>
  <option value="America/Belize">(GMT-06:00) Belize</option>
  <option value="America/Chicago">(GMT-06:00) Central Time</option>
  <option value="America/Costa_Rica">(GMT-06:00) Costa Rica</option>
  <option value="America/El_Salvador">(GMT-06:00) El Salvador</option>
  <option value="America/Guatemala">(GMT-06:00) Guatemala</option>
  <option value="America/Managua">(GMT-06:00) Managua</option>
  <option value="America/Mexico_City">(GMT-06:00) Central Time - Mexico City</option>
  <option value="America/Regina">(GMT-06:00) Central Time - Regina</option>
  <option value="America/Tegucigalpa">(GMT-06:00) Central Time - Tegucigalpa</option>
  <option value="America/Winnipeg">(GMT-06:00) Central Time - Winnipeg</option>
  <option value="Pacific/Galapagos">(GMT-06:00) Galapagos</option>
  <option value="America/Bogota">(GMT-05:00) Bogota</option>
  <option value="America/Cayman">(GMT-05:00) Cayman</option>
  <option value="America/Guayaquil">(GMT-05:00) Guayaquil</option>
  <option value="America/Havana">(GMT-05:00) Havana</option>
  <option value="America/Iqaluit">(GMT-05:00) Eastern Time - Iqaluit</option>
  <option value="America/Jamaica">(GMT-05:00) Jamaica</option>
  <option value="America/Lima">(GMT-05:00) Lima</option>
  <option value="America/Montreal">(GMT-05:00) Eastern Time - Montreal</option>
  <option value="America/Nassau">(GMT-05:00) Nassau</option>
  <option value="America/New_York">(GMT-05:00) Eastern Time</option>
  <option value="America/Panama">(GMT-05:00) Panama</option>
  <option value="America/Port-au-Prince">(GMT-05:00) Port-au-Prince</option>
  <option value="America/Rio_Branco">(GMT-05:00) Rio Branco</option>
  <option value="America/Toronto">(GMT-05:00) Eastern Time - Toronto</option>
  <option value="Pacific/Easter">(GMT-05:00) Easter Island</option>
  <option value="America/Caracas">(GMT-04:30) Caracas</option>
  <option value="America/Antigua">(GMT-04:00) Antigua</option>
  <option value="America/Asuncion">(GMT-04:00) Asuncion</option>
  <option value="America/Barbados">(GMT-04:00) Barbados</option>
  <option value="America/Boa_Vista">(GMT-04:00) Boa Vista</option>
  <option value="America/Campo_Grande">(GMT-04:00) Campo Grande</option>
  <option value="America/Cuiaba">(GMT-04:00) Cuiaba</option>
  <option value="America/Curacao">(GMT-04:00) Curacao</option>
  <option value="America/Grand_Turk">(GMT-04:00) Grand Turk</option>
  <option value="America/Guyana">(GMT-04:00) Guyana</option>
  <option value="America/Halifax">(GMT-04:00) Atlantic Time - Halifax</option>
  <option value="America/La_Paz">(GMT-04:00) La Paz</option>
  <option value="America/Manaus">(GMT-04:00) Manaus</option>
  <option value="America/Martinique">(GMT-04:00) Martinique</option>
  <option value="America/Port_of_Spain">(GMT-04:00) Port of Spain</option>
  <option value="America/Porto_Velho">(GMT-04:00) Porto Velho</option>
  <option value="America/Puerto_Rico">(GMT-04:00) Puerto Rico</option>
  <option value="America/Santo_Domingo">(GMT-04:00) Santo Domingo</option>
  <option value="America/Thule">(GMT-04:00) Thule</option>
  <option value="Atlantic/Bermuda">(GMT-04:00) Bermuda</option>
  <option value="America/St_Johns">(GMT-03:30) Newfoundland Time - St. Johns</option>
  <option value="America/Araguaina">(GMT-03:00) Araguaina</option>
  <option value="America/Argentina/Buenos_Aires">(GMT-03:00) Buenos Aires</option>
  <option value="America/Bahia">(GMT-03:00) Salvador</option>
  <option value="America/Belem">(GMT-03:00) Belem</option>
  <option value="America/Cayenne">(GMT-03:00) Cayenne</option>
  <option value="America/Fortaleza">(GMT-03:00) Fortaleza</option>
  <option value="America/Godthab">(GMT-03:00) Godthab</option>
  <option value="America/Maceio">(GMT-03:00) Maceio</option>
  <option value="America/Miquelon">(GMT-03:00) Miquelon</option>
  <option value="America/Montevideo">(GMT-03:00) Montevideo</option>
  <option value="America/Paramaribo">(GMT-03:00) Paramaribo</option>
  <option value="America/Recife">(GMT-03:00) Recife</option>
  <option value="America/Santiago">(GMT-03:00) Santiago</option>
  <option value="America/Sao_Paulo">(GMT-03:00) Sao Paulo</option>
  <option value="Antarctica/Palmer">(GMT-03:00) Palmer</option>
  <option value="Antarctica/Rothera">(GMT-03:00) Rothera</option>
  <option value="Atlantic/Stanley">(GMT-03:00) Stanley</option>
  <option value="America/Noronha">(GMT-02:00) Noronha</option>
  <option value="Atlantic/South_Georgia">(GMT-02:00) South Georgia</option>
  <option value="America/Scoresbysund">(GMT-01:00) Scoresbysund</option>
  <option value="Atlantic/Azores">(GMT-01:00) Azores</option>
  <option value="Atlantic/Cape_Verde">(GMT-01:00) Cape Verde</option>
  <option value="Africa/Abidjan">(GMT+00:00) Abidjan</option>
  <option value="Africa/Accra">(GMT+00:00) Accra</option>
  <option value="Africa/Bissau">(GMT+00:00) Bissau</option>
  <option value="Africa/Casablanca">(GMT+00:00) Casablanca</option>
  <option value="Africa/El_Aaiun">(GMT+00:00) El Aaiun</option>
  <option value="Africa/Monrovia">(GMT+00:00) Monrovia</option>
  <option value="America/Danmarkshavn">(GMT+00:00) Danmarkshavn</option>
  <option value="Atlantic/Canary">(GMT+00:00) Canary Islands</option>
  <option value="Atlantic/Faroe">(GMT+00:00) Faeroe</option>
  <option value="Atlantic/Reykjavik">(GMT+00:00) Reykjavik</option>
  <option value="Etc/GMT">(GMT+00:00) GMT (no daylight saving)</option>
  <option value="Europe/Dublin">(GMT+00:00) Dublin</option>
  <option value="Europe/Lisbon">(GMT+00:00) Lisbon</option>
  <option value="Europe/London">(GMT+00:00) London</option>
  <option value="Africa/Algiers">(GMT+01:00) Algiers</option>
  <option value="Africa/Ceuta">(GMT+01:00) Ceuta</option>
  <option value="Africa/Lagos">(GMT+01:00) Lagos</option>
  <option value="Africa/Ndjamena">(GMT+01:00) Ndjamena</option>
  <option value="Africa/Tunis">(GMT+01:00) Tunis</option>
  <option value="Africa/Windhoek">(GMT+01:00) Windhoek</option>
  <option value="Europe/Amsterdam">(GMT+01:00) Amsterdam</option>
  <option value="Europe/Andorra">(GMT+01:00) Andorra</option>
  <option value="Europe/Belgrade">(GMT+01:00) Central European Time - Belgrade</option>
  <option value="Europe/Berlin">(GMT+01:00) Berlin</option>
  <option value="Europe/Brussels">(GMT+01:00) Brussels</option>
  <option value="Europe/Budapest">(GMT+01:00) Budapest</option>
  <option value="Europe/Copenhagen">(GMT+01:00) Copenhagen</option>
  <option value="Europe/Gibraltar">(GMT+01:00) Gibraltar</option>
  <option value="Europe/Luxembourg">(GMT+01:00) Luxembourg</option>
  <option value="Europe/Madrid">(GMT+01:00) Madrid</option>
  <option value="Europe/Malta">(GMT+01:00) Malta</option>
  <option value="Europe/Monaco">(GMT+01:00) Monaco</option>
  <option value="Europe/Oslo">(GMT+01:00) Oslo</option>
  <option value="Europe/Paris">(GMT+01:00) Paris</option>
  <option value="Europe/Prague">(GMT+01:00) Central European Time - Prague</option>
  <option value="Europe/Rome">(GMT+01:00) Rome</option>
  <option value="Europe/Stockholm">(GMT+01:00) Stockholm</option>
  <option value="Europe/Tirane">(GMT+01:00) Tirane</option>
  <option value="Europe/Vienna">(GMT+01:00) Vienna</option>
  <option value="Europe/Warsaw">(GMT+01:00) Warsaw</option>
  <option value="Europe/Zurich">(GMT+01:00) Zurich</option>
  <option value="Africa/Cairo">(GMT+02:00) Cairo</option>
  <option value="Africa/Johannesburg">(GMT+02:00) Johannesburg</option>
  <option value="Africa/Maputo">(GMT+02:00) Maputo</option>
  <option value="Africa/Tripoli">(GMT+02:00) Tripoli</option>
  <option value="Asia/Amman">(GMT+02:00) Amman</option>
  <option value="Asia/Beirut">(GMT+02:00) Beirut</option>
  <option value="Asia/Damascus">(GMT+02:00) Damascus</option>
  <option value="Asia/Gaza">(GMT+02:00) Gaza</option>
  <option value="Asia/Jerusalem">(GMT+02:00) Jerusalem</option>
  <option value="Asia/Nicosia">(GMT+02:00) Nicosia</option>
  <option value="Europe/Athens">(GMT+02:00) Athens</option>
  <option value="Europe/Bucharest">(GMT+02:00) Bucharest</option>
  <option value="Europe/Chisinau">(GMT+02:00) Chisinau</option>
  <option value="Europe/Helsinki">(GMT+02:00) Helsinki</option>
  <option value="Europe/Istanbul">(GMT+02:00) Istanbul</option>
  <option value="Europe/Kaliningrad">(GMT+02:00) Moscow-01 - Kaliningrad</option>
  <option value="Europe/Kiev">(GMT+02:00) Kiev</option>
  <option value="Europe/Riga">(GMT+02:00) Riga</option>
  <option value="Europe/Sofia">(GMT+02:00) Sofia</option>
  <option value="Europe/Tallinn">(GMT+02:00) Tallinn</option>
  <option value="Europe/Vilnius">(GMT+02:00) Vilnius</option>
  <option value="Africa/Khartoum">(GMT+03:00) Khartoum</option>
  <option value="Africa/Nairobi">(GMT+03:00) Nairobi</option>
  <option value="Antarctica/Syowa">(GMT+03:00) Syowa</option>
  <option value="Asia/Baghdad">(GMT+03:00) Baghdad</option>
  <option value="Asia/Qatar">(GMT+03:00) Qatar</option>
  <option value="Asia/Riyadh">(GMT+03:00) Riyadh</option>
  <option value="Europe/Minsk">(GMT+03:00) Minsk</option>
  <option value="Europe/Moscow">(GMT+03:00) Moscow+00</option>
  <option value="Asia/Tehran">(GMT+03:30) Tehran</option>
  <option value="Asia/Baku">(GMT+04:00) Baku</option>
  <option value="Asia/Dubai">(GMT+04:00) Dubai</option>
  <option value="Asia/Tbilisi">(GMT+04:00) Tbilisi</option>
  <option value="Asia/Yerevan">(GMT+04:00) Yerevan</option>
  <option value="Europe/Samara">(GMT+04:00) Moscow+00 - Samara</option>
  <option value="Indian/Mahe">(GMT+04:00) Mahe</option>
  <option value="Indian/Mauritius">(GMT+04:00) Mauritius</option>
  <option value="Indian/Reunion">(GMT+04:00) Reunion</option>
  <option value="Asia/Kabul">(GMT+04:30) Kabul</option>
  <option value="Antarctica/Mawson">(GMT+05:00) Mawson</option>
  <option value="Asia/Aqtau">(GMT+05:00) Aqtau</option>
  <option value="Asia/Aqtobe">(GMT+05:00) Aqtobe</option>
  <option value="Asia/Ashgabat">(GMT+05:00) Ashgabat</option>
  <option value="Asia/Dushanbe">(GMT+05:00) Dushanbe</option>
  <option value="Asia/Karachi">(GMT+05:00) Karachi</option>
  <option value="Asia/Tashkent">(GMT+05:00) Tashkent</option>
  <option value="Asia/Yekaterinburg">(GMT+05:00) Moscow+02 - Yekaterinburg</option>
  <option value="Indian/Kerguelen">(GMT+05:00) Kerguelen</option>
  <option value="Indian/Maldives">(GMT+05:00) Maldives</option>
  <option value="Asia/Calcutta">(GMT+05:30) India Standard Time</option>
  <option value="Asia/Colombo">(GMT+05:30) Colombo</option>
  <option value="Asia/Katmandu">(GMT+05:45) Katmandu</option>
  <option value="Antarctica/Vostok">(GMT+06:00) Vostok</option>
  <option value="Asia/Almaty">(GMT+06:00) Almaty</option>
  <option value="Asia/Bishkek">(GMT+06:00) Bishkek</option>
  <option value="Asia/Dhaka">(GMT+06:00) Dhaka</option>
  <option value="Asia/Omsk">(GMT+06:00) Moscow+03 - Omsk, Novosibirsk</option>
  <option value="Asia/Thimphu">(GMT+06:00) Thimphu</option>
  <option value="Indian/Chagos">(GMT+06:00) Chagos</option>
  <option value="Asia/Rangoon">(GMT+06:30) Rangoon</option>
  <option value="Indian/Cocos">(GMT+06:30) Cocos</option>
  <option value="Antarctica/Davis">(GMT+07:00) Davis</option>
  <option value="Asia/Bangkok">(GMT+07:00) Bangkok</option>
  <option value="Asia/Hovd">(GMT+07:00) Hovd</option>
  <option value="Asia/Jakarta">(GMT+07:00) Jakarta</option>
  <option value="Asia/Krasnoyarsk">(GMT+07:00) Moscow+04 - Krasnoyarsk</option>
  <option value="Asia/Saigon">(GMT+07:00) Hanoi</option>
  <option value="Indian/Christmas">(GMT+07:00) Christmas</option>
  <option value="Antarctica/Casey">(GMT+08:00) Casey</option>
  <option value="Asia/Brunei">(GMT+08:00) Brunei</option>
  <option value="Asia/Choibalsan">(GMT+08:00) Choibalsan</option>
  <option value="Asia/Hong_Kong">(GMT+08:00) Hong Kong</option>
  <option value="Asia/Irkutsk">(GMT+08:00) Moscow+05 - Irkutsk</option>
  <option value="Asia/Kuala_Lumpur">(GMT+08:00) Kuala Lumpur</option>
  <option value="Asia/Macau">(GMT+08:00) Macau</option>
  <option value="Asia/Makassar">(GMT+08:00) Makassar</option>
  <option value="Asia/Manila">(GMT+08:00) Manila</option>
  <option value="Asia/Shanghai">(GMT+08:00) China Time - Beijing</option>
  <option value="Asia/Singapore">(GMT+08:00) Singapore</option>
  <option value="Asia/Taipei">(GMT+08:00) Taipei</option>
  <option value="Asia/Ulaanbaatar">(GMT+08:00) Ulaanbaatar</option>
  <option value="Australia/Perth">(GMT+08:00) Western Time - Perth</option>
  <option value="Asia/Dili">(GMT+09:00) Dili</option>
  <option value="Asia/Jayapura">(GMT+09:00) Jayapura</option>
  <option value="Asia/Pyongyang">(GMT+09:00) Pyongyang</option>
  <option value="Asia/Seoul">(GMT+09:00) Seoul</option>
  <option value="Asia/Tokyo">(GMT+09:00) Tokyo</option>
  <option value="Asia/Yakutsk">(GMT+09:00) Moscow+06 - Yakutsk</option>
  <option value="Pacific/Palau">(GMT+09:00) Palau</option>
  <option value="Australia/Adelaide">(GMT+09:30) Central Time - Adelaide</option>
  <option value="Australia/Darwin">(GMT+09:30) Central Time - Darwin</option>
  <option value="Asia/Magadan">(GMT+10:00) Moscow+08 - Magadan</option>
  <option value="Asia/Vladivostok">(GMT+10:00) Moscow+07 - Yuzhno-Sakhalinsk</option>
  <option value="Australia/Brisbane">(GMT+10:00) Eastern Time - Brisbane</option>
  <option value="Australia/Hobart">(GMT+10:00) Eastern Time - Hobart</option>
  <option value="Australia/Sydney">(GMT+10:00) Eastern Time - Melbourne, Sydney</option>
  <option value="Pacific/Chuuk">(GMT+10:00) Truk</option>
  <option value="Pacific/Guam">(GMT+10:00) Guam</option>
  <option value="Pacific/Port_Moresby">(GMT+10:00) Port Moresby</option>
  <option value="Pacific/Saipan">(GMT+10:00) Saipan</option>
  <option value="Pacific/Efate">(GMT+11:00) Efate</option>
  <option value="Pacific/Guadalcanal">(GMT+11:00) Guadalcanal</option>
  <option value="Pacific/Kosrae">(GMT+11:00) Kosrae</option>
  <option value="Pacific/Noumea">(GMT+11:00) Noumea</option>
  <option value="Pacific/Pohnpei">(GMT+11:00) Ponape</option>
  <option value="Pacific/Norfolk">(GMT+11:30) Norfolk</option>
  <option value="Asia/Kamchatka">(GMT+12:00) Moscow+08 - Petropavlovsk-Kamchatskiy</option>
  <option value="Pacific/Auckland">(GMT+12:00) Auckland</option>
  <option value="Pacific/Fiji">(GMT+12:00) Fiji</option>
  <option value="Pacific/Funafuti">(GMT+12:00) Funafuti</option>
  <option value="Pacific/Kwajalein">(GMT+12:00) Kwajalein</option>
  <option value="Pacific/Majuro">(GMT+12:00) Majuro</option>
  <option value="Pacific/Nauru">(GMT+12:00) Nauru</option>
  <option value="Pacific/Tarawa">(GMT+12:00) Tarawa</option>
  <option value="Pacific/Wake">(GMT+12:00) Wake</option>
  <option value="Pacific/Wallis">(GMT+12:00) Wallis</option>
  <option value="Pacific/Apia">(GMT+13:00) Apia</option>
  <option value="Pacific/Enderbury">(GMT+13:00) Enderbury</option>
  <option value="Pacific/Fakaofo">(GMT+13:00) Fakaofo</option>
  <option value="Pacific/Tongatapu">(GMT+13:00) Tongatapu</option>
  <option value="Pacific/Kiritimati">(GMT+14:00) Kiritimati</option>
</select>
'''
    currentTimezone.children().each(function() {
      if (Number($(this).val()) === selected)
        $(this).prop("selected", true);
    });
    currentTimezone.change(savePreferences);
    return currentTimezone;
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

  function createEmailTeamMemberOption(email, send) {
'''
<li #view>
  <label #teamMember class="checkbox esper-preference-check">
    <input #check type="checkbox" class="esper-prefs-email"/>
  </label>
</li>
'''
    check.prop("checked", send);
    check.click(savePreferences);

    teamMember.append(email);
    return view;
  }

  function viewOfEmailType(type, defaults, team) {
'''
<li #view class="preference">
  <div #toggle>
    <div #toggleBg class="preference-toggle-bg on"/>
    <div #toggleSwitch class="preference-toggle-switch on"/>
  </div>
  <div #title class="preference-title semibold"/>
  <hr/>
  <div #options class="preference-options">
    <div class="preference-option-selector-row clearfix">
      <div class="preference-option-col clearfix">
        <div class="preference-option-title semibold">Send To</div>
        <ul #teamMembers>
          <div #spinner class="spinner table-spinner"/>
        </ul>
      </div>
    </div>
  </div>
</li>
'''
    function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    var name = type.split("-").map(capitalize).join(" ");
    title.text(name);

    spinner.show();

    var team_members =
      List.union([team.team_executive], team.team_assistants, undefined);
    Deferred.join(List.map(team_members, function(uid) {
      return Api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        spinner.hide();
        profiles.forEach(function(profile) {
          var email = profile.email;
          var send = List.mem(defaults.recipients, email);
          teamMembers.append(createEmailTeamMemberOption(email, send));
        });
      });

    if (defaults.enabled === false) togglePreference(_view, team.teamid, false);
    toggle.click(function() {
      togglePreference(_view, team.teamid, undefined);
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

  var eventColors = {
    "Bold_blue": "#5484ed",
    "Blue": "#a4bdfc",
    "Turquoise": "#46d6db",
    "Green": "#7ae7bf",
    "Bold_green": "#51b749",
    "Yellow": "#fbd75b",
    "Orange": "#ffb878",
    "Red": "#ff887c",
    "Bold_red": "#dc2127",
    "Purple": "#dbadff",
    "Gray": "#e1e1e1"
  };

  function showEventColorPicker(picker, checkbox, saved) {
    Api.getEventColors().done(function(colors) {
      List.iter(colors.palette, function(col) {

        var box = $("<div class='esper-event-color'/>");
        box.data("key", col.key)
           .data("color", col.color)
           .css("background-color", eventColors[col.color]);
        if (saved !== undefined && saved.color === col.color)
          box.addClass("esper-event-color-selected");

        box.mouseover(function() {
          if (!box.hasClass("esper-event-color-selected"))
            box.addClass("esper-event-color-hover");
        });
        box.mouseout(function() {
          box.removeClass("esper-event-color-hover");
        });
        box.click(function() {
          $(".esper-event-color").removeClass("esper-event-color-selected");
          box.removeClass("esper-event-color-hover")
             .addClass("esper-event-color-selected");
          checkbox.prop("checked", true);
          savePreferences();
        });

        picker.append(box);
      });
    });
  }

  function viewOfGeneralPrefs(general : ApiT.GeneralPrefs,
                              team : ApiT.Team) {
'''
<li #view class="preference">
  <div #title class="preference-title semibold">General</div>
  <hr/>
  <div #options class="preference-options">
    <ul>
      <li>
        <label class="checkbox esper-preference-check">
          <input #sendConfirmation type="checkbox"
                 class="esper-prefs-confirmation"/>
          Send confirmation emails to executive
        </label>
      </li>
      <li>
        <label class="checkbox esper-preference-check">
          <input #sendReminder type="checkbox"
                 class="esper-prefs-reminder"/>
          Send reminder emails to executive
        </label>
      </li>
      <li>
        <label class="checkbox esper-preference-check">
          <input #useDuplicate type="checkbox" checked="checked"
                 class="esper-prefs-duplicate"/>
          Use duplicate calendar events to invite guests
        </label>
      </li>
      <li>
        <label class="checkbox esper-preference-check">
          <input #bccExec type="checkbox" checked="checked"
                 class="esper-prefs-bcc"/>
          Bcc exec on first email to guests
        </label>
      </li>
      <li>
        <label class="checkbox esper-preference-check">
          <input #holdColor type="checkbox"
                 class="esper-prefs-hold-color"/>
          Use a different color for HOLD/unconfirmed events
        </label>
        <div #colorPicker/>
      </li>
    </ul>
  </div>
</li>
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
      if (general.hold_event_color !== undefined)
        holdColor.prop("checked", true);
    }

    sendConfirmation.click(savePreferences);
    sendReminder.click(savePreferences);
    useDuplicate.click(savePreferences);
    bccExec.click(savePreferences);

    var savedColor = general.hold_event_color;
    showEventColorPicker(colorPicker, holdColor, savedColor);
    holdColor.click(function() {
      var check = holdColor.is(":checked");
      if (!check)
        $(".esper-event-color").removeClass("esper-event-color-selected");
      if (!check || $(".esper-event-color-selected").length > 0)
        savePreferences();
    });

    return view;
  }

function viewOfGeneralTimezonePrefs(general : ApiT.GeneralPrefs,
                              team : ApiT.Team) {
'''
<li #view class="preference">
  <div #title class="preference-title semibold">Time Zone</div>
  <hr/>
  <div #timezoneCol class="preference-option-col clearfix">
    <div class="preference-option-title semibold">Current Timezone of Executive</div>
  </div>
</li>
'''
    timezoneCol.append(createTimezoneSelector("US/Pacific"));

    if (general !== undefined) {
      timezoneCol.find(".esper-prefs-timezone").val(general.current_timezone);
    }

    timezoneCol.click(savePreferences);

    return view;
  }

  export function load(team, tabView?) {
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
  <div class="table-header">Email Preferences</div>
  <ul #emails class="table-list">
    <div #emailsDivider class="table-divider"/>
  </ul>
  <div class="table-header">General Scheduling</div>
  <ul #general class="table-list esper-prefs-general">
    <div #generalDivider class="table-divider"/>
  </ul>
  <div class="table-header">Coworkers</div>
  <div>
  <div class="preferences-coworkers">
    <textarea #coworkers
              rows=5
              placeholder="Leave notes about coworkers here"
              class="coworkers-textbox">
    </textarea>
    <div class="save-coworkers-bar">
      <button #saveCoworkers class="button-primary" disabled>Save</button>
    </div>
  </div>
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


      if (initial.email_types !== undefined) {
        emails
          .append(viewOfEmailType(
            "daily-agenda", initial.email_types.daily_agenda, team))
          .append(viewOfEmailType(
            "tasks-update", initial.email_types.tasks_update, team))
        setDividerHeight("emails", emailsDivider, 1);
      }

      general.append(viewOfGeneralPrefs(initial.general, team));
      general.append(viewOfGeneralTimezonePrefs(initial.general, team));
      //setDividerHeight("general", generalDivider, 1);

      coworkers.val(initial.coworkers);
      Util.afterTyping(coworkers, 250, function() {
        saveCoworkers.prop("disabled", false);
      });
      saveCoworkers.click(function() {
        savePreferences();
        saveCoworkers.prop("disabled", true);
      });

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
