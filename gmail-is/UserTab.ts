/* Executive scheduling preferences */

module Esper.UserTab {

  function formatTime(hourMinute: ApiT.HourMinute) {
    return XDate.formatTimeOnly(hourMinute.hour, hourMinute.minute, "");
  }

  function displayAssistantAlias(container: JQuery, alias: string[]) {
'''
<div #view>
  <div>
    <span class="esper-bold">Name:</span>
    <span #aliasName></span>
  </div>
  <div>
    <span class="esper-bold">Email:</span>
    <span #aliasEmail></span>
  </div>
</div>
'''
    if (alias !== undefined) {
      aliasName.text(alias[0]);
      aliasEmail.text(alias[1]);

      container.append(view);
    }
  }

  function displayAvailability(meetingPrefs: JQuery,
                               availabilities: ApiT.Availability[],
                               last: boolean) {
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
      List.iter(availabilities, function(a : ApiT.Availability, i) {
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
      List.iter(favoriteLocations, function(l : ApiT.Location, i) {
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
      });
    }

    meetingPrefs.append(view);
  }

  function displayVideoUsernames(meetingPrefs: JQuery,
                                 videoAccounts: ApiT.VideoAccount[]) {
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

    var numUsernames = videoAccounts.length;
    if (numUsernames === 0) {
      usernames.append($("<li class='esper-empty-list'>No usernames</li>"));
    } else {
      List.iter(videoAccounts, function(v : ApiT.VideoAccount, i) {
'''
<li #videoUsername>
  <div #type class="esper-bold"/>
  <div #username/>
</li>
'''
        if (i == (numUsernames - 1))
          videoUsername.addClass("esper-last");
        type.text(v.video_type + ": ");
        username.text(v.video_username);
        usernames.append(videoUsername);
      });
    }

    meetingPrefs.append(view);
  }

  function displayPhoneNumbers(meetingPrefs: JQuery,
                               phoneNumbers: ApiT.PhoneNumber[]) {
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
      List.iter(phoneNumbers, function(p : ApiT.PhoneNumber, i) {
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
      });
    }

    meetingPrefs.append(view);
  }

  function displayPhoneInfo(meetingView: JQuery,
                            meetingPrefs: ApiT.PhoneInfo) {
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
    displayPhoneNumbers(view, meetingPrefs.phones);

    meetingView.children().remove();
    meetingView.append(view);
  }

  function displayVideoInfo(meetingView: JQuery,
                            meetingPrefs: ApiT.VideoInfo) {
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
    displayVideoUsernames(view, meetingPrefs.accounts);

    meetingView.children().remove();
    meetingView.append(view);
  }

  function displayMealInfo(meetingView: JQuery,
                           meetingPrefs: ApiT.MealInfo) {
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
    displayFavoriteLocations(view, meetingPrefs.favorites);

    meetingView.children().remove();
    meetingView.append(view);
  }

  function viewOfTransportationType(transportationType: string,
                                    last: boolean) {
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

  function populateMeetingsDropdown(drop: JQuery,
                                  meetInfo: JQuery,
                                  meetingTypes: ApiT.MeetingTypes,
                                  workplaces: ApiT.Workplace[]) {
    function option(value, display) {
      $("<option>")
        .attr("value", value)
        .text(display)
        .appendTo(drop);
    }

    function available(x: { available: boolean }) {
      return (x !== undefined && x.available);
    }

    if (available(meetingTypes.phone_call))
      option("phone_call", "Phone call");
    if (available(meetingTypes.video_call))
      option("video_call", "Video call");
    if (available(meetingTypes.breakfast))
      option("breakfast", "Breakfast");
    if (available(meetingTypes.brunch))
      option("brunch", "Brunch");
    if (available(meetingTypes.lunch))
      option("lunch", "Lunch");
    if (available(meetingTypes.coffee))
      option("coffee", "Coffee");
    if (available(meetingTypes.dinner))
      option("dinner", "Dinner");
    if (available(meetingTypes.drinks))
      option("drinks", "Drinks");

    $("<option disabled>──────</option>").appendTo(drop);

    List.iter(workplaces, function(workplace, i) {
      var title = workplace.location.title;
      if (title === "") title = workplace.location.address;
      $("<option value='" + i.toString() + "'>" + title + "</option>")
        .appendTo(drop);
    });

    drop.change(function() {
      var field = $(this).val();
      if (field === "header") return;
      else if (field === "phone_call")
        displayPhoneInfo(meetInfo, meetingTypes.phone_call);
      else if (field === "video_call")
        displayVideoInfo(meetInfo, meetingTypes.video_call);
      else if (!isNaN(field))
        displayWorkplace(meetInfo, workplaces[field]);
      else
        displayMealInfo(meetInfo, meetingTypes[field]);
    });
  }

  function displayWorkplace(workInfo: JQuery,
                            workplace: ApiT.Workplace) {
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
</div>
'''
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");

    address.text(workplace.location.address);
    durationText.text(formatDuration(workplace.duration));

    var last = true;
    displayAvailability(view, workplace.availability, last);

    viewMap.click(function() {
      // TODO: open Google Maps
    });

    workInfo.children().remove();
    workInfo.append(view);
  }

  function viewOfUser(team: ApiT.Team, prefs: ApiT.Preferences) {
'''
<div #view>
  <div #spinner>
    <div class="esper-spinner esper-tab-header-spinner"/>
  </div>
  <div #profPic class="esper-profile-pic"/>
  <div class="esper-profile-row esper-profile-name-row">
    <span #name class="esper-profile-name"/>
    <span #membership class="esper-badge"/>
    <object #appleLogo class="esper-svg esper-ios-app-icon"/>
  </div>
  <div #email class="esper-profile-row esper-profile-email"/>
  <div #mobile class="esper-profile-row esper-profile-email"/>
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

        var phoneInfo = prefs.meeting_types.phone_call;
        if (phoneInfo !== undefined) {
          var pubMobile = List.find(phoneInfo.phones, function(p) {
            return p.phone_type === "Mobile" && p.share_with_guests;
          });
          if (pubMobile !== null)
            mobile.text("Mobile: " + pubMobile.phone_number);
          else
            mobile.hide();
        }

        if (profile.has_ios_app)
          appleLogo.attr("data", Init.esperRootUrl + "img/apple.svg");
        else
          appleLogo.hide();
      });

    Api.getCustomerStatus(teamid).done(function(customer) {
      var sub = customer.status;
      var plan = customer.plan;

      if (sub === "Trialing" || sub === "Active")
        membership.addClass("esper-active");
      else if (sub === "Past_due" || sub === "Canceled" || sub === "Unpaid")
        membership.addClass("esper-suspended");
      else {
        sub = "No Subscription";
        membership.addClass("esper-suspended");
      }

      if (sub === "Active" && plan !== undefined)
        sub = Util.nameOfPlan(plan);

      membership.text(sub.replace("_", " ").toUpperCase());
    });

    return view;
  }

  function displayDetailedGeneralPrefs(container : JQuery,
                               prefs : ApiT.GeneralPrefs) {
'''
<div #view>
  <div>
    <span>Send exec confirmations:</span>
    <span class="esper-red" #sendConfirmation>No</span>
  </div>
  <div>
    <span>Send exec reminders:</span>
    <span class="esper-red" #sendReminder>No</span>
  </div>
  <div>
    <span>Use duplicate events:</span>
    <span class="esper-green" #useDuplicate>Yes</span>
  </div>
  <div>
    <span>Bcc exec:</span>
    <span class="esper-green" #bccExec>Yes</span>
  </div>
</ul>
'''
    if (prefs.send_exec_confirmation)
      sendConfirmation.text("Yes")
        .removeClass("esper-red")
        .addClass("esper-green");
    if (prefs.send_exec_reminder)
      sendReminder.text("Yes")
        .removeClass("esper-red")
        .addClass("esper-green");
    if (!prefs.use_duplicate_events)
      useDuplicate.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");
    if (!prefs.bcc_exec_on_reply)
      bccExec.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");

    container.append(view);
  }

  function displayGeneralPrefs(container : JQuery,
                               prefs : ApiT.GeneralPrefs) {
'''
<div #view>
  <div>
    <span>Bcc exec:</span>
    <span class="esper-green" #bccExec>Yes</span>
  </div>
</ul>
'''
    if (!prefs.bcc_exec_on_reply)
      bccExec.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");

    container.append(view);
  }

  function displayTeamLabel(container : JQuery,
                             teamLabel : string) {
'''
<div #view>
  <span #label>
</div>
'''

    label.text(teamLabel)
    container.append(view)
  }

  export function viewOfUserTab(team: ApiT.Team,
                                profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #user class="esper-tab-header"/>
  <div class="esper-tab-overflow">
    <div #preferencesSpinner class="esper-events-list-loading">
      <div class="esper-spinner esper-list-spinner"/>
    </div>
    <div class="esper-section">
      <div #aliasHeader class="esper-section-header esper-clearfix">
        <span #showAlias
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Assistant Alias</span>
      </div>
      <div #aliasContainer
           class="esper-section-container esper-preferences-general"
           style="display:none"/>
    </div>
    <div class="esper-section">
      <div #generalHeader
           class="esper-section-header esper-open esper-clearfix">
        <span #showGeneral
              class="esper-link" style="float:right">Show More</span>
        <span class="esper-bold" style="float:left">General</span>
      </div>
      <div #generalContainer
           class="esper-section-container esper-preferences-general"/>
      <div #generalDetailedContainer
           class="esper-section-container esper-preferences-general"
           style="display:none"/>
    </div>
    <div #teamLabelsSection class="esper-section">
      <div #teamLabelsHeader class="esper-section-header esper-clearfix">
        <span #showTeamLabels
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Labels</span>
      </div>
      <div #teamLabelsContainer class="esper-section-container
           esper-preferences-general"
           style="display:none">
      </div>
    </div>
    <div #coworkerSection class="esper-section">
      <div #coworkersHeader class="esper-section-header esper-clearfix">
        <span #showCoworkers
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Coworkers</span>
      </div>
      <div #coworkersContainer class="esper-section-container"
           style="display:none">
        <pre #coworkers class="esper-preferences-notes"/>
      </div>
    </div>
    <div #calendarsSection class="esper-section" style="display:none">
      <div #calendarsHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showCalendars
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Calendars</span>
      </div>
      <div #calendarsContainer class="esper-section-container"/>
    </div>
    <div class="esper-section">
      <div #meetingsHeader class="esper-section-header esper-clearfix">
        <span #showMeetings
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Meetings</span>
      </div>
      <div #meetingsContainer class="esper-section-container"
           style="display:none">
        <div #meetingsSelector class="esper-section-selector esper-clearfix">
          <span class="esper-show-selector">Show: </span>
          <select #meetingSelector class="esper-select"/>
        </div>
        <div #meetingInfo/>
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
    var emailData = esperGmail.get.email_data();
    var threadMembers = emailData.people_involved;
    var aliasesUsed = List.filterMap(threadMembers, function(m) {
      if (List.mem(team.team_email_aliases, m[1])) return m;
      else return null;
    });
    displayAssistantAlias(aliasContainer, aliasesUsed[0]);

    team.team_labels.forEach(function(label) {
      displayTeamLabel(teamLabelsContainer, label);
    })

    Api.getPreferences(team.teamid).done(function(prefs) {
      preferencesSpinner.hide();
      user.append(viewOfUser(team, prefs));

      var meetingTypes = prefs.meeting_types;
      var workplaces = prefs.workplaces;
      populateMeetingsDropdown(meetingSelector, meetingInfo,
        meetingTypes, workplaces);
      if (workplaces.length > 0)
        displayWorkplace(meetingInfo, workplaces[0]);
      else if (meetingTypes.phone_call !== undefined)
        displayPhoneInfo(meetingInfo, meetingTypes.phone_call);

      var transportationTypes = prefs.transportation.length;
      List.iter(prefs.transportation, function(type, i) {
        var last = i === prefs.transportation.length - 1;
        transportationPreferences.append(viewOfTransportationType(type, last));
      });

      if (prefs.general !== undefined)
        displayGeneralPrefs(generalContainer, prefs.general);
        displayDetailedGeneralPrefs(generalDetailedContainer, prefs.general);

      if (prefs.coworkers !== "") {
        coworkers.text(prefs.coworkers);
      } else {
        coworkerSection.hide()
      }

      notes.text(prefs.notes);
    });

    Sidebar.customizeSelectArrow(meetingSelector);

    showAlias.click(function() {
      Sidebar.toggleList(aliasContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        aliasHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        aliasHeader.addClass("esper-open");
      }
    });

    showCalendars.click(function() {
      Sidebar.toggleList(calendarsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        calendarsHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        calendarsHeader.addClass("esper-open");
      }
    });

    showMeetings.click(function() {
      Sidebar.toggleList(meetingsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        meetingsHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        meetingsHeader.addClass("esper-open");
      }
    });

    showTransportation.click(function() {
      Sidebar.toggleList(transportationContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        transportationHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        transportationHeader.addClass("esper-open");
      }
    });

    showGeneral.click(function() {
      Sidebar.toggleList(generalContainer);
      Sidebar.toggleList(generalDetailedContainer);
      if (this.innerHTML === "Show Less") {
        $(this).text("Show More");
      } else {
        $(this).text("Show Less");
      }
    });

    showTeamLabels.click(function() {
      Sidebar.toggleList(teamLabelsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        teamLabelsHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        teamLabelsHeader.addClass("esper-open");
      }
    });

    showCoworkers.click(function() {
      Sidebar.toggleList(coworkersContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        coworkersHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        coworkersHeader.addClass("esper-open");
      }
    });

    showNotes.click(function() {
      Sidebar.toggleList(notesContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        notesHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        notesHeader.addClass("esper-open");
      }
    });

    showNotes.click();
    showCoworkers.click();
    if (aliasesUsed[0] !== undefined) showAlias.click();
    if (team.team_labels.length > 0) showTeamLabels.click();

    return _view;
  }

}
