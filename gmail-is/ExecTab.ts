/* Executive scheduling preferences */

module Esper.ExecTab {

  function formatTime(hourMinute) {
    var hour = hourMinute.hour;
    var minute = hourMinute.minute;
    if (minute < 10) minute = "0" + minute;
    var ampm = hour < 12 ? "am" : "pm";
    if (hour > 12) hour = hour - 12;
    return hour + ":" + minute + ampm;
  }

  function formatTimeRange(fromDay, fromHourMinute, toDay, toHourMinute) {
    var fromTime = formatTime(fromHourMinute);
    var toTime = formatTime(toHourMinute);
    if (fromDay === toDay) toDay = "";
    return [fromDay, fromTime, "to", toDay, toTime].join(" ");
  }

  function displayAvailability(ul, availabilities) {
    List.iter(availabilities, function(a : ApiT.Availability) {
      var text = formatTimeRange(a.avail_from.day, a.avail_from.time,
                                 a.avail_to.day, a.avail_to.time);
      $("<li>" + text + "</li>")
        .appendTo(ul);
    });
  }

  function formatDuration(hourMinute) {
    var text = "";
    var hour = hourMinute.hour;
    var minute = hourMinute.minute;
    if (hour > 0)
      text += hour + (hour === 1 ? " hour " : " hours ");
    if (minute > 0 || hour === 0)
      text += minute + (minute === 1 ? " minute" : " minutes");
    return text;
  }

  function displayWorkplace(workInfo, workplace) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-row esper-clearfix">
    <span #viewMap class="esper-preference-text esper-link">Map</span>
    <object #locationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Address</span>
    <div #address/>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <span #viewAvailability class="esper-preference-text esper-link">View</span>
    <object #availabilityIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Availability</span>
    <ul #avail/>
  </div>
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");
    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");

    address.text(workplace.location.address);
    durationText.text(formatDuration(workplace.duration));
    // bufferText.text(formatDuration(workplace.buffer));
    displayAvailability(avail, workplace.availability);
    workInfo.children().remove();
    workInfo.append(view);
  }

  function populateWorkplaceDropdown(drop, workInfo, workplaces) {
    for (var i = 0; i < workplaces.length; i++) {
      var workplace = workplaces[i];
      var title = workplace.location.title;
      if (title === "") title = workplace.location.address;
      $("<option value='" + i + "'>" + title + "</option>")
        .appendTo(drop);
    }
    drop.change(function() {
      var i = $(this).val();
      displayWorkplace(workInfo, workplaces[i]);
    });
  }

  function displayPhoneNumbers(ul, phoneNumbers) {
    List.iter(phoneNumbers, function(p : ApiT.PhoneNumber) {
      var text = p.phone_type + ": " + p.phone_number;
      if (p.share_with_guests) text += " (OK to share)";
      else text += " (private)";
      $("<li>" + text + "</li>")
        .appendTo(ul);
    });
  }

  function displayPhonePrefs(meetInfo, phonePrefs) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-row esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <span #viewAvailability class="esper-preference-text esper-link">View</span>
    <object #availabilityIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Availability</span>
    <ul #avail/>
  </div>
  <div class="esper-preference-row esper-clearfix">
    <object #phoneIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Phone numbers</span>
    <ul #phones/>
  </div>
</div>
'''
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");
    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");
    phoneIcon.attr("data", Init.esperRootUrl + "img/phone.svg");

    durationText.text(formatDuration(phonePrefs.duration));
    bufferText.text(formatDuration(phonePrefs.buffer));
    displayAvailability(avail, phonePrefs.availability);
    displayPhoneNumbers(phones, phonePrefs.phones);
    meetInfo.children().remove();
    meetInfo.append(view);
  }

  function displayVideoAccounts(ul, videoAccounts) {
    List.iter(videoAccounts, function(v : ApiT.VideoAccount) {
      var text = v.video_type + ": " + v.video_username;
      $("<li>" + text + "</li>")
        .appendTo(ul);
    });
  }

  function displayVideoPrefs(meetInfo, videoPrefs) {
'''
<div #view>
  <div #duration>Duration: </div>
  <div>
    Availability: <ul #avail/>
  </div>
  <div>
    Video call accounts: <ul #video/>
  </div>
</div>
'''
    duration.append(formatDuration(videoPrefs.duration));
    displayAvailability(avail, videoPrefs.availability);
    displayVideoAccounts(video, videoPrefs.accounts);
    meetInfo.children().remove();
    meetInfo.append(view);
  }

  function displayFavoritePlaces(ul, favorites) {
    List.iter(favorites, function(l : ApiT.Location) {
      var text = "";
      if (l.title !== "") text += l.title;
      if (l.address !== "") {
        if (text !== "") text += ": ";
        text += l.address;
      }
      if (l.public_notes !== undefined)
        text += " (" + l.public_notes + ")";
      if (l.private_notes !== undefined)
        text += " [Note: " + l.private_notes + "]";
      $("<li>" + text + "</li>")
        .appendTo(ul);
    });
  }

  function displayMealPrefs(meetInfo, mealPrefs) {
'''
<div #view>
  <div #duration>Duration: </div>
  <div>
    Availability: <ul #avail/>
  </div>
  <div>
    Favorites: <ul #faves/>
  </div>
</div>
'''
    duration.append(formatDuration(mealPrefs.duration));
    displayAvailability(avail, mealPrefs.availability);
    displayFavoritePlaces(faves, mealPrefs.favorites);
    meetInfo.children().remove();
    meetInfo.append(view);
  }

  function populateMeetingsDropdown(drop, meetInfo, meetingTypes) {
    function option(field, display) {
      $("<option value='" + field + "'>" + display + "</option>")
        .appendTo(drop);
    }

    if (meetingTypes.phone_call !== undefined)
      option("phone_call", "Phone call");
    if (meetingTypes.video_call !== undefined)
      option("video_call", "Video call");
    if (meetingTypes.breakfast !== undefined)
      option("breakfast", "Breakfast");
    if (meetingTypes.brunch !== undefined)
      option("brunch", "Brunch");
    if (meetingTypes.lunch !== undefined)
      option("lunch", "Lunch");
    if (meetingTypes.coffee !== undefined)
      option("coffee", "Coffee");
    if (meetingTypes.dinner !== undefined)
      option("dinner", "Dinner");
    if (meetingTypes.drinks !== undefined)
      option("drinks", "Drinks");

    drop.change(function() {
      var field = $(this).val();
      if (field === "header") return;
      else if (field === "phone_call")
        displayPhonePrefs(meetInfo, meetingTypes.phone_call);
      else if (field === "video_call")
        displayVideoPrefs(meetInfo, meetingTypes.video_call);
      else
        displayMealPrefs(meetInfo, meetingTypes[field]);
    });
  }

  export function displayExecutiveTab(tab2, team, profiles) {
'''
<div #view>
  <div #preferencesSpinner class="esper-events-list-loading">
    <div class="esper-spinner esper-list-spinner"/>
  </div>
  <div class="esper-section">
    <div #workplacesHeader class="esper-section-header esper-clearfix open">
      <span #showWorkplaces
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Workplaces</span>
    </div>
    <div #workplacesContainer class="esper-section-container">
      <div #workplacesSelector class="esper-section-selector esper-clearfix">
        <span>View: </span>
        <select #workplaceSelector class="esper-select"/>
      </div>
      <div #workplaceInfo/>
    </div>
  </div>
  <div class="esper-section">
    <div #transportationHeader class="esper-section-header esper-clearfix open">
      <span #showTransportation
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Transportation</span>
    </div>
    <div #transportationContainer class="esper-section-container">
      <div #transportationInfo/>
    </div>
  </div>
  <div class="esper-section">
    <div #meetingPreferencesHeader class="esper-section-header esper-clearfix open">
      <span #showMeetingPreferences
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Meeting Preferences</span>
    </div>
    <div #meetingPreferencesContainer class="esper-section-container">
      <div #meetingPreferencesSelector class="esper-section-selector esper-clearfix">
        <span>View: </span>
        <select #meetingSelector class="esper-select"/>
      </div>
      <div #meetingPreferences/>
    </div>
  </div>
  <div class="esper-section">
    <div #notesHeader class="esper-section-header esper-clearfix open">
      <span #showNotes
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Notes</span>
    </div>
    <div #notesContainer class="esper-section-container">
      <pre #notes class="esper-preferences-notes"/>
    </div>
  </div>
</div>
'''
    Api.getPreferences(team.teamid).done(function(prefs) {
      preferencesSpinner.hide();
      var workplaces = prefs.workplaces;
      populateWorkplaceDropdown(workplaceSelector, workplaceInfo, workplaces);
      if (workplaces.length > 0)
        displayWorkplace(workplaceInfo, workplaces[0]);

      var meetingTypes = prefs.meeting_types;
      populateMeetingsDropdown(meetingSelector, meetingPreferences, meetingTypes);
      displayPhonePrefs(meetingPreferences, meetingTypes.phone_call);

      notes.text(prefs.notes);
    });

    Sidebar.customizeSelectArrow(workplaceSelector);
    Sidebar.customizeSelectArrow(meetingSelector);

    showWorkplaces.click(function() {
      Sidebar.toggleList(workplacesContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        workplacesHeader.removeClass("open");
      } else {
        $(this).text("Hide");
        workplacesHeader.addClass("open");
      }
    });

    showTransportation.click(function() {
      Sidebar.toggleList(transportationContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        transportationHeader.removeClass("open");
      } else {
        $(this).text("Hide");
        transportationHeader.addClass("open");
      }
    });

    showMeetingPreferences.click(function() {
      Sidebar.toggleList(meetingPreferencesContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        meetingPreferencesHeader.removeClass("open");
      } else {
        $(this).text("Hide");
        meetingPreferencesHeader.addClass("open");
      }
    });

    showNotes.click(function() {
      Sidebar.toggleList(notesContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        notesHeader.removeClass("open");
      } else {
        $(this).text("Hide");
        notesHeader.addClass("open");
      }
    });

    tab2.append(view);
  }

}
