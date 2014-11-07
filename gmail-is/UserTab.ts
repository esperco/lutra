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

  function displayAvailability(meetingPrefs, availabilities, last) {
'''
<div #view class="esper-preference-section esper-contains-list esper-clearfix">
  <div class="esper-clearfix">
    <span #viewAvailability class="esper-preference-text esper-link">View</span>
    <object #availabilityIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Availability</span>
  </div>
  <ul #availability class="esper-preference-list"/>
</div>
'''
    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");

    if (last)
      view.addClass("esper-last");

    var numAvailabilities = availabilities.length;
    if (numAvailabilities === 0) {
      viewAvailability.hide();
      availability
        .append($("<li class='esper-empty-list'>No availability</li>"));
    } else {
      var i = 0;
      List.iter(availabilities, function(a : ApiT.Availability) {
'''
<li #availabilityRow>
  <span #fromDayText class="esper-bold"/>
  <span #fromTimeText/>
  <span>to</span>
  <span #toDayText class="esper-bold"/>
  <span #toTimeText/>
</li>
'''
        if (i == (numAvailabilities - 1))
          availabilityRow.addClass("esper-last");

        var fromDay = a.avail_from.day;
        var toDay = a.avail_to.day;
        if (fromDay === toDay) toDay = "";

        fromDayText.text(fromDay);
        fromTimeText.text(" " + formatTime(a.avail_from.time) + " ");
        toDayText.text(toDay);
        toTimeText.text(" " + formatTime(a.avail_to.time) + " ");

        availability.append(availabilityRow);
        i++;
      });

      viewAvailability.click(function() {
        // TODO: open calendar modal
      });
    }

    meetingPrefs.append(view);
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
<div #view class="esper-preference-section esper-clearfix
                  esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #locationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Favorite locations</span>
  </div>
  <ul #locations class="esper-preference-list"/>
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");

    var numLocations = favoriteLocations.length;
    if (numLocations === 0) {
      locations
        .append($("<li class='esper-empty-list'>No favorite locations</li>"));
    } else {
      var i = 0;
      List.iter(favoriteLocations, function(l : ApiT.Location) {
'''
<li #location>
  <span #viewMap class="esper-link" style="float:right">Map</span>
  <div #name class="esper-favorite-location-name esper-bold"/>
  <div #address/>
  <div #publicNotes class="esper-gray"/>
  <div #privateNotes class="esper-gray"/>
</li>
'''
        if (i == (numLocations -1))
          location.addClass("esper-last");

        if (l.title !== "") name.text(l.title);
        if (l.address !== "") address.text(l.address);
        if (l.public_notes !== undefined) publicNotes.text(l.public_notes);
        if (l.private_notes !== undefined) privateNotes.text(l.private_notes);

        viewMap.click(function() {
          // TODO: open Google Maps
        });

        locations.append(location);
        i++
      });
    }

    meetingPrefs.append(view);
  }

  function displayVideoUsernames(meetingPrefs, videoUsernames) {
'''
<div #view class="esper-preference-section esper-clearfix
                  esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #videoIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Usernames</span>
  </div>
  <ul #usernames class="esper-preference-list"/>
</div>
'''
    videoIcon.attr("data", Init.esperRootUrl + "img/video.svg");

    var numUsernames = videoUsernames.length;
    if (numUsernames === 0) {
      usernames.append($("<li class='esper-empty-list'>No usernames</li>"));
    } else {
      var i = 0;
      List.iter(videoUsernames, function(v : ApiT.VideoAccount) {
'''
<li #videoUsername>
  <div #type class="esper-bold"/>
  <div #username/>
</li>
'''
        if (i == (numUsernames -1))
          videoUsername.addClass("esper-last");
        type.text(v.video_type + ": ");
        username.text(v.video_username);
        usernames.append(videoUsername);
        i++;
      });
    }

    meetingPrefs.append(view);
  }

  function displayPhoneNumbers(meetingPrefs, phoneNumbers) {
'''
<div #view class="esper-preference-section
                  esper-clearfix esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #phoneIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Phone numbers</span>
  </div>
  <ul #phones class="esper-preference-list"/>
</div>
'''
    phoneIcon.attr("data", Init.esperRootUrl + "img/phone.svg");

    var numPhones = phoneNumbers.length;
    if (numPhones === 0) {
      phones.append($("<li class='esper-empty-list'>No phone numbers</li>"));
    } else {
      var i = 0;
      List.iter(phoneNumbers, function(p : ApiT.PhoneNumber) {
'''
<li #phoneNumber>
  <span #type class="esper-bold"/>
  <span #number/>
  <div #note class="esper-gray"/>
</li>
'''
        if (i == (numPhones -1))
          phoneNumber.addClass("esper-last");
        type.text(p.phone_type + ": ");
        number.text(p.phone_number);
        if (p.share_with_guests) note.text("OK to share with guests");
        else note.text("Do NOT share with guests");
        phones.append(phoneNumber);
        i++;
      });
    }

    meetingPrefs.append(view);
  }

  function displayMeetingPrefs(meetingType, meetingView, meetingPrefs) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>

</div>
'''
    durationText.text(formatDuration(meetingPrefs.duration));
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");

    bufferText.text(formatDuration(meetingPrefs.buffer));
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");

    var last = false;
    displayAvailability(view, meetingPrefs.availability, last);

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
  <object #icon class="esper-svg esper-transportation-icon"/>
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

  function createMeetingsDropdown(drop, meetInfo, meetingTypes) {
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
<div #view class="esper-workplace-preferences">
  <div class="esper-preference-section">
    <div class="esper-clearfix">
      <span #viewMap class="esper-preference-text esper-link">Map</span>
      <object #locationIcon class="esper-svg esper-preference-icon"/>
      <span class="esper-preference-title esper-bold">Address</span>
    </div>
    <div #address class="esper-preference-info"/>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Duration</span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">Buffer time</span>
  </div>
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");

    address.text(workplace.location.address);
    console.log(workplace.duration);
    durationText.text(formatDuration(workplace.duration));
    bufferText.text(formatDuration(workplace.buffer));

    var last = true;
    displayAvailability(view, workplace.availability, last);

    viewMap.click(function() {
      // TODO: open Google Maps
    });

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

  function viewOfUser(team) {
'''
<div #view>
  <div #spinner>
    <div class="esper-spinner esper-tab-header-spinner"/>
  </div>
  <div #profPic class="esper-profile-pic"/>
  <div class="esper-profile-row esper-profile-name-row">
    <span #name class="esper-profile-name"/>
    <span #membership class="esper-membership-badge"/>
  </div>
  <div #email class="esper-profile-row esper-profile-email esper-gray"/>
</div>
'''
    var teamid = team.teamid;

    Api.getProfile(team.team_executive, teamid)
      .done(function(profile) {
        spinner.hide();
        if (profile.image_url !== undefined)
          profPic.css("background-image", "url('" + profile.image_url + "')");
        name.text(team.team_name);
        email.text(profile.email);
      });;

    var membershipStatus = "free trial"; // TODO: get membership status
    if (membershipStatus == "free trial")
      membership.addClass("free-trial");
    else if (membershipStatus == "suspended")
      membership.addClass("suspended");
    else
      membership.addClass("active");

    membership.text(membershipStatus.toUpperCase());

    return view;
  }

  export function viewOfUserTab(team, profiles) {
'''
<div #view>
  <div #user class="esper-tab-header"/>
  <div class="esper-tab-overflow">
    <div #preferencesSpinner class="esper-events-list-loading">
      <div class="esper-spinner esper-list-spinner"/>
    </div>
    <div #calendarsSection class="esper-section" style="display:none">
      <div #calendarsHeader class="esper-section-header esper-clearfix open">
        <span #showCalendars
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Calendars</span>
      </div>
      <div #calendarsContainer class="esper-section-container"/>
    </div>
    <div class="esper-section">
      <div #workplacesHeader class="esper-section-header esper-clearfix">
        <span #showWorkplaces
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Workplaces</span>
      </div>
      <div #workplacesContainer class="esper-section-container"
           style="display:none">
        <div #workplacesSelector class="esper-section-selector esper-clearfix">
          <span class="esper-show-selector">Show: </span>
          <select #workplaceSelector class="esper-select"/>
        </div>
        <div #workplaceInfo/>
      </div>
    </div>
    <div class="esper-section">
      <div #transportationHeader class="esper-section-header esper-clearfix">
        <span #showTransportation
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Transportation</span>
      </div>
      <div #transportationContainer class="esper-section-container"
           style="display:none">
        <ul #transportationPreferences
            class="esper-transportation-preferences"/>
      </div>
    </div>
    <div class="esper-section">
      <div #meetingPreferencesHeader
           class="esper-section-header esper-clearfix">
        <span #showMeetingPreferences
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Meeting Preferences</span>
      </div>
      <div #meetingPreferencesContainer class="esper-section-container"
            style="display:none">
        <div #meetingPreferencesSelector
             class="esper-section-selector esper-clearfix">
          <span class="esper-show-selector">Show: </span>
          <select #meetingSelector class="esper-select"/>
        </div>
        <div #meetingPreferences/>
      </div>
    </div>
    <div class="esper-section">
      <div #notesHeader class="esper-section-header esper-clearfix">
        <span #showNotes
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Notes</span>
      </div>
      <div #notesContainer class="esper-section-container" style="display:none">
        <pre #notes class="esper-preferences-notes"/>
      </div>
    </div>
  </div>
</div>
'''
    user.append(viewOfUser(team));

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
        transportationPreferences.append(viewOfTransportationType(type, last));
        i++;
      });

      var meetingTypes = prefs.meeting_types;
      createMeetingsDropdown(meetingSelector, meetingPreferences, meetingTypes);
      displayMeetingPrefs("phone", meetingPreferences, meetingTypes.phone_call);

      notes.text(prefs.notes);
    });

    Sidebar.customizeSelectArrow(workplaceSelector);
    Sidebar.customizeSelectArrow(meetingSelector);

    showCalendars.click(function() {
      Sidebar.toggleList(calendarsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        calendarsHeader.removeClass("open");
      } else {
        $(this).text("Hide");
        calendarsHeader.addClass("open");
      }
    });

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

    return _view;
  }

}
