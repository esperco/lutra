/* Executive scheduling preferences */

module Esper.UserTab {

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

  function displayFavoriteLocations(meetingPrefs, favoriteLocations) {
'''
<div #view class="esper-preference-section esper-clearfix">
  <div class="esper-clearfix">
    <object #locationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Favorite locations</span>
  </div>
  <ul #locations/>
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");

    List.iter(favoriteLocations, function(l : ApiT.Location) {
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
        .appendTo(locations);
    });

    meetingPrefs.append(view);
  }

  function displayVideoUsernames(meetingPrefs, videoUsernames) {
'''
<div #view class="esper-preference-section esper-clearfix">
  <div class="esper-clearfix">
    <object #videoIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Usernames</span>
  </div>
  <ul #usernames/>
</div>
'''
    videoIcon.attr("data", Init.esperRootUrl + "img/video.svg");

    List.iter(videoUsernames, function(v : ApiT.VideoAccount) {
      var text = v.video_type + ": " + v.video_username;
      $("<li>" + text + "</li>")
        .appendTo(usernames);
    });

    meetingPrefs.append(view);
  }

  function displayPhoneNumbers(meetingPrefs, phoneNumbers) {
'''
<div #view class="esper-preference-section esper-clearfix">
  <div class="esper-clearfix">
    <object #phoneIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Phone numbers</span>
  </div>
  <ul #phones/>
</div>
'''
    phoneIcon.attr("data", Init.esperRootUrl + "img/phone.svg");

    List.iter(phoneNumbers, function(p : ApiT.PhoneNumber) {
      var text = p.phone_type + ": " + p.phone_number;
      if (p.share_with_guests) text += " (OK to share)";
      else text += " (private)";
      $("<li>" + text + "</li>")
        .appendTo(phones);
    });

    meetingPrefs.append(view);
  }

  function displayMeetingPrefs(meetingType, meetingView, meetingPrefs) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <div class="esper-clearfix">
      <span #viewAvailability class="esper-preference-text esper-link">View</span>
      <object #availabilityIcon class="esper-preference-icon"/>
      <span class="esper-preference-title esper-bold">Availability</span>
    </div>
    <ul #avail/>
  </div>
</div>
'''
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");
    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");

    durationText.text(formatDuration(meetingPrefs.duration));
    bufferText.text(formatDuration(meetingPrefs.buffer));
    displayAvailability(avail, meetingPrefs.availability);

    if (meetingType === "phone")
      displayPhoneNumbers(view, meetingPrefs.phones);
    else if (meetingType === "video")
      displayVideoUsernames(view, meetingPrefs.accounts);
    else if (meetingType === "meal")
      displayFavoriteLocations(view, meetingPrefs.favorites);

    meetingView.children().remove();
    meetingView.append(view);
  }

  function viewOfTransportationType(transportationType, last) {
'''
<li #view class="esper-transportation-type esper-clearfix">
  <object #icon class="esper-transportation-icon"/>
  <span #label class="esper-transportation-title"/>
</li>
'''
    var imageFile = transportationType.toLowerCase();
    icon.attr("data", Init.esperRootUrl + "img/" + imageFile + ".svg");
    label.text(transportationType);

    if (last)
      view.addClass("esper-last");

    return view;
  }

  function populateMeetingsDropdown(drop, meetInfo, meetingTypes) {
    function option(field, display) {
      $("<option value='" + field + "'>" + display + "</option>")
        .appendTo(drop);
    }

    function unavailable(type) {
      return ((type !== undefined) && type.available);
    }

    if (unavailable(meetingTypes.phone_call))
      option("phone_call", "Phone call");
    if (unavailable(meetingTypes.video_call))
      option("video_call", "Video call");
    if (unavailable(meetingTypes.breakfast))
      option("breakfast", "Breakfast");
    if (unavailable(meetingTypes.brunch))
      option("brunch", "Brunch");
    if (unavailable(meetingTypes.lunch))
      option("lunch", "Lunch");
    if (unavailable(meetingTypes.coffee))
      option("coffee", "Coffee");
    if (unavailable(meetingTypes.dinner))
      option("dinner", "Dinner");
    if (unavailable(meetingTypes.drinks))
      option("drinks", "Drinks");

    drop.change(function() {
      var field = $(this).val();
      if (field === "header") return;
      else if (field === "phone_call")
        displayMeetingPrefs("phone", meetInfo, meetingTypes.phone_call);
      else if (field === "video_call")
        displayMeetingPrefs("video", meetInfo, meetingTypes.video_call);
      else
        displayMeetingPrefs("meal", meetInfo, meetingTypes[field]);
    });
  }

  function displayWorkplace(workInfo, workplace) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section">
    <div class="esper-clearfix">
      <span #viewMap class="esper-preference-text esper-link">Map</span>
      <object #locationIcon class="esper-preference-icon"/>
      <span class="esper-preference-title esper-bold">Address</span>
    </div>
    <div #address class="esper-preference-info"/>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <div class="esper-clearfix">
      <span #viewAvailability class="esper-preference-text esper-link">View</span>
      <object #availabilityIcon class="esper-preference-icon"/>
      <span class="esper-preference-title esper-bold">Availability</span>
    </div>
    <ul #avail/>
  </div>
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");
    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");

    address.text(workplace.location.address);
    console.log(workplace.duration);
    durationText.text(formatDuration(workplace.duration));
    bufferText.text(formatDuration(workplace.buffer));
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

  export function displayUserTab(tab2, team, profiles) {
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
        <span class="esper-show-selector">Show: </span>
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
      <ul #transportationPreferences class="esper-transportation-preferences"/>
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
        <span class="esper-show-selector">Show: </span>
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

      var transportationTypes = prefs.transportation.length;
      var i = 0;
      var last = false;
      List.iter(prefs.transportation, function(type) {
        if (i == (transportationTypes -1))
          last = true;
        viewOfTransportationType(type, last).appendTo(transportationPreferences);
        i++;
      });

      var meetingTypes = prefs.meeting_types;
      populateMeetingsDropdown(meetingSelector, meetingPreferences, meetingTypes);
      displayMeetingPrefs("phone", meetingPreferences, meetingTypes.phone_call);

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
