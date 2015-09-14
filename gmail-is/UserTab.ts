/* Executive scheduling preferences */

module Esper.UserTab {

  export var currentMeetingType : string = "other";

  function formatTime(hourMinute: ApiT.HourMinute) {
    return XDate.formatTimeOnly(hourMinute.hour, hourMinute.minute, "");
  }

  function displayAvailability(meetingPrefs: JQuery,
                               availabilities: ApiT.Availability[],
                               last: boolean,
                               changes) {
'''
<div #view class="esper-preference-section esper-contains-list esper-clearfix">
  <div class="esper-clearfix">
    <span #viewAvailability class="esper-preference-text esper-link">View</span>
    <object #availabilityIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Availability
      <object #availNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <ul #availability class="esper-preference-list"/>
</div>
'''
    if (changes.length > 0) {
      availNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    availabilityIcon.attr("data", Init.esperRootUrl + "img/availability.svg");

    if (last) {
      view.addClass("esper-last");
    }

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
        if (i == (numAvailabilities - 1)) {
          availabilityRow.addClass("esper-last");
        }

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
    if (hour > 0) {
      text += hour + (hour === 1 ? " hour " : " hours ");
    } if (minute > 0 || hour === 0) {
      text += minute + (minute === 1 ? " minute" : " minutes");
    }
    return text;
  }

  function displayFavoriteLocations(meetingPrefs, favoriteLocations,
                                    changes) {
'''
<div #view class="esper-preference-section esper-clearfix
                  esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #locationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Favorite locations
      <object #locationsNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <ul #locations class="esper-preference-list"/>
</div>
'''
    if (changes.length > 0) {
      locationsNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

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
        if (i == (numLocations -1)) {
          location.addClass("esper-last");
        }

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
                                 videoAccounts: ApiT.VideoAccount[],
                                 changes) {
'''
<div #view class="esper-preference-section esper-clearfix
                  esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #videoIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Usernames
      <object #usernameNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <ul #usernames class="esper-preference-list"/>
</div>
'''
    if (changes.length > 0) {
      usernameNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

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
        if (i == (numUsernames - 1)) {
          videoUsername.addClass("esper-last");
        }
        type.text(v.video_type + ": ");
        username.text(v.video_username);
        usernames.append(videoUsername);
      });
    }

    meetingPrefs.append(view);
  }

  function displayPhoneNumbers(meetingPrefs: JQuery,
                               phoneNumbers: ApiT.PhoneNumber[],
                               changes) {
'''
<div #view class="esper-preference-section
                  esper-clearfix esper-contains-list esper-last">
  <div class="esper-clearfix">
    <object #phoneIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Phone numbers
      <object #phonesNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <ul #phones class="esper-preference-list"/>
</div>
'''
    if (changes.length > 0) {
      phonesNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

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
        if (i == (numPhones -1)) {
          phoneNumber.addClass("esper-last");
        }
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
                            meetingPrefs: ApiT.PhoneInfo,
                            changes) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Duration
      <object #durationNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Buffer
      <object #bufferNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
</div>
'''
    if (getSubPreferenceChanges("Duration", changes).length > 0) {
      durationNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
}

    durationText.text(formatDuration(meetingPrefs.duration));
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");

    if (getSubPreferenceChanges("Buffer", changes).length > 0) {
      bufferNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    bufferText.text(formatDuration(meetingPrefs.buffer));
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");

    var last = false;
    displayAvailability(view, meetingPrefs.availability, last,
      getSubPreferenceChanges("Availability", changes));
    displayPhoneNumbers(view, meetingPrefs.phones,
      getSubPreferenceChanges("Phones", changes));

    meetingView.children().remove();
    meetingView.append(view);
  }

  function displayVideoInfo(meetingView: JQuery,
                            meetingPrefs: ApiT.VideoInfo,
                            changes) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Duration
      <object #durationNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Buffer
      <object #bufferNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
</div>
'''
    if (getSubPreferenceChanges("Duration", changes).length > 0) {
      durationNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    durationText.text(formatDuration(meetingPrefs.duration));
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");

    if (getSubPreferenceChanges("Buffer", changes).length > 0) {
      bufferNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    bufferText.text(formatDuration(meetingPrefs.buffer));
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");

    var last = false;
    displayAvailability(view, meetingPrefs.availability, last,
      getSubPreferenceChanges("Availability", changes));
    displayVideoUsernames(view, meetingPrefs.accounts,
      getSubPreferenceChanges("Accounts", changes));

    meetingView.children().remove();
    meetingView.append(view);
  }

  function displayMealInfo(meetingView: JQuery,
                           meetingPrefs: ApiT.MealInfo,
                           changes) {
'''
<div #view class="esper-meeting-preferences">
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Duration
      <object #durationNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text"/>
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Buffer
      <object #bufferNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
</div>
'''
    if (getSubPreferenceChanges("Duration", changes).length > 0) {
      durationNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    durationText.text(formatDuration(meetingPrefs.duration));
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");

    if (getSubPreferenceChanges("Buffer", changes).length > 0) {
      bufferNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    bufferText.text(formatDuration(meetingPrefs.buffer));
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");

    var last = false;
    displayAvailability(view, meetingPrefs.availability, last,
      getSubPreferenceChanges("Availability", changes));
    displayFavoriteLocations(view, meetingPrefs.favorites,
      getSubPreferenceChanges("Favorites", changes));

    meetingView.children().remove();
    meetingView.append(view);
  }

  export function populateMeetingsDropdown(drop: JQuery,
                                           meetInfo: JQuery,
                                           noMeetingPrefs: JQuery,
                                           meetingTypes: ApiT.MeetingTypes,
                                           workplaces: ApiT.Workplace[],
                                           meeting_changes,
                                           workplace_changes) {
    function option(value, display) {
      var type = display.split(" ")[0];
      if (getSubPreferenceChanges(type, meeting_changes).length > 0) {
        display = display + "*";
      }
      $("<option>")
        .attr("value", value)
        .text(display)
        .appendTo(drop);
    }

    function available(x: { available: boolean }) {
      return (x !== undefined && x.available);
    }

    if (available(meetingTypes.phone_call)) {
      option("phone_call", "Phone call");
    }
    if (available(meetingTypes.video_call)) {
      option("video_call", "Video call");
    }
    if (available(meetingTypes.breakfast)) {
      option("breakfast", "Breakfast");
    }
    if (available(meetingTypes.brunch)) {
      option("brunch", "Brunch");
    }
    if (available(meetingTypes.lunch)) {
      option("lunch", "Lunch");
    }
    if (available(meetingTypes.coffee)) {
      option("coffee", "Coffee");
    }
    if (available(meetingTypes.dinner)) {
      option("dinner", "Dinner");
    }
    if (available(meetingTypes.drinks)) {
      option("drinks", "Drinks");
    }

    $("<option disabled>──────</option>").appendTo(drop);

    var new_changes = getSubPreferenceChanges("Change", workplace_changes);

    List.iter(workplaces, function(workplace, i) {
      var title = workplace.location.title;
      if (title === "") title = workplace.location.address;

      var added_changes = List.filterMap(new_changes, function(change) {
        var added = List.filter(change.workplaces_added, function(w) {
          return (w["location"].title === title
                  || w["location"].address === title);
        });
        if (added.length > 0) return added;
        else return null;
      });
      var relevant_changes = List.filter(workplace_changes, function(change) {
        return (change[1].title === title);
      });

      if (relevant_changes.length > 0 || added_changes.length > 0) {
        title = title + "*";
      }

      $("<option value='" + i.toString() + "'>" + title + "</option>")
        .appendTo(drop);
    });

    drop.change(function() {
      var field = $(this).val();

      if (isNaN(field)) {
        currentMeetingType = field.toLowerCase().replace(/ /, "_");
      } else {
        currentMeetingType = workplaces[field].location.title;
      }

      if (field === "header") {
        return;
      } else {
        meetInfo.show();
        noMeetingPrefs.hide();
      }

      if (field === "phone_call") {
        var phone_changes = getSubPreferenceChanges("Phone", meeting_changes);
        displayPhoneInfo(meetInfo, meetingTypes.phone_call, phone_changes);
      } else if (field === "video_call") {
        var video_changes = getSubPreferenceChanges("Video", meeting_changes);
        displayVideoInfo(meetInfo, meetingTypes.video_call, video_changes);
      } else if (!isNaN(field)) {
        displayWorkplace(meetInfo, workplaces[field], workplace_changes);
      }
      else {
        var meal = field.charAt(0).toUpperCase() + field.substring(1);
        var meal_changes = getSubPreferenceChanges(meal, meeting_changes);
        displayMealInfo(meetInfo, meetingTypes[field], meal_changes);
      }
    });
  }

  function displayWorkplace(workInfo: JQuery,
                            workplace: ApiT.Workplace,
                            changes) {
'''
<div #view class="esper-workplace-preferences">
  <div class="esper-preference-section">
    <div class="esper-clearfix">
      <span #viewMap class="esper-preference-text esper-link">Map</span>
      <object #locationIcon class="esper-svg esper-preference-icon"/>
      <span class="esper-preference-title esper-bold">
        Location
        <object #locationNew class="esper-svg esper-new-preference-icon"/>
      </span>
    </div>
    <div #address class="esper-preference-info"/>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #durationText class="esper-preference-text"/>
    <object #durationIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Duration
      <object #durationNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #bufferText class="esper-preference-text" />
    <object #bufferIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold" >
      Buffer
      <object #bufferNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
  <div class="esper-preference-section esper-clearfix">
    <span #distanceText class="esper-preference-text"/>
    <object #distanceIcon class="esper-svg esper-preference-icon"/>
    <span class="esper-preference-title esper-bold">
      Distance
      <object #distanceNew class="esper-svg esper-new-preference-icon"/>
    </span>
  </div>
</div>
'''
    var title = "";
    if (workplace.location.title === "") title = workplace.location.address;
    else title = workplace.location.title;

    var location_changes =
      List.filterMap(getSubPreferenceChanges("Location", changes),
        function(change) {
          return (change.title === title);
        });
    var duration_changes =
      List.filterMap(getSubPreferenceChanges("Duration", changes),
        function(change) {
          return (change.title === title);
        });
    var buffer_changes =
      List.filterMap(getSubPreferenceChanges("Buffer", changes),
        function(change) {
          return (change.title === title);
        });
    var distance_changes =
      List.filterMap(getSubPreferenceChanges("Distance", changes),
        function(change) {
          return (change.title === title);
        });
    var availability_changes =
      List.filter(getSubPreferenceChanges("Availability", changes),
        function(change) {
          return (change.title === title);
        });

    if (location_changes.length > 0) {
      locationNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (duration_changes.length > 0) {
      durationNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (buffer_changes.length > 0) {
      bufferNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (distance_changes.length > 0) {
      distanceNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    locationIcon.attr("data", Init.esperRootUrl + "img/location.svg");
    durationIcon.attr("data", Init.esperRootUrl + "img/duration.svg");
    bufferIcon.attr("data", Init.esperRootUrl + "img/buffer.svg");
    distanceIcon.attr("data", Init.esperRootUrl + "img/distance.svg");

    address.text(workplace.location.address);
    durationText.text(formatDuration(workplace.duration));
    bufferText.text(formatDuration(workplace.buffer));
    distanceText.text(workplace.distance + " miles");

    var last = true;
    displayAvailability(view, workplace.availability, last,
      availability_changes);

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
        if (profile.image_url !== undefined) {
          profPic.css("background-image", "url('" + profile.image_url + "')");
        }
        name.text(team.team_name);
        email.text(profile.email);

        var phoneInfo = prefs.meeting_types.phone_call;
        if (phoneInfo !== undefined) {
          var pubMobile = List.find(phoneInfo.phones, function(p) {
            return p.phone_type === "Mobile" && p.share_with_guests;
          });
          if (pubMobile !== null) {
            mobile.text("Mobile: " + pubMobile.phone_number);
          } else {
            mobile.hide();
          }
        }

        if (profile.has_ios_app) {
          appleLogo.attr("data", Init.esperRootUrl + "img/apple.svg");
        } else {
          appleLogo.hide();
        }
      });

    Api.getCustomerStatus(teamid).done(function(customer) {
      var sub = customer.status;
      var plan = customer.plan;

      if (sub === "Trialing" || sub === "Active") {
        membership.addClass("esper-active");
      } else if (sub === "Past_due" || sub === "Canceled" || sub === "Unpaid") {
        membership.addClass("esper-suspended");
      } else {
        sub = "No Subscription";
        membership.addClass("esper-suspended");
      }

      if (sub === "Active" && plan !== undefined) {
        sub = Util.nameOfPlan(plan);
      }
      membership.text(sub.replace("_", " ").toUpperCase());
    });

    return view;
  }

  function displayDetailedGeneralPrefs(container : JQuery,
                               prefs : ApiT.GeneralPrefs,
                               changes) {
'''
<div #view>
  <div>
    <span>
      <object #confNew class="esper-svg esper-new-preference-icon"/>
      Send exec confirmations:
    </span>
    <span class="esper-red" #sendConfirmation>No</span>
  </div>
  <div>
    <span>
      <object #remindNew class="esper-svg esper-new-preference-icon"/>
      Send exec reminders:
    </span>
    <span class="esper-red" #sendReminder>No</span>
  </div>
  <div>
    <span>
      <object #dupeNew class="esper-svg esper-new-preference-icon"/>
      Use duplicate events:
    </span>
    <span class="esper-green" #useDuplicate>Yes</span>
  </div>
  <div>
    <span>
      <object #bccNew class="esper-svg esper-new-preference-icon"/>
      Bcc exec:
    </span>
    <span class="esper-green" #bccExec>Yes</span>
  </div>
</ul>
'''
    if (getSubPreferenceChanges("Confirmation", changes).length > 0) {
      confNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (getSubPreferenceChanges("Reminder", changes).length > 0) {
      remindNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (getSubPreferenceChanges("Duplicate", changes).length > 0) {
      dupeNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }
    if (getSubPreferenceChanges("Bcc", changes).length > 0) {
      bccNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    if (prefs.send_exec_confirmation) {
      sendConfirmation.text("Yes")
        .removeClass("esper-red")
        .addClass("esper-green");
    }
    if (prefs.send_exec_reminder) {
      sendReminder.text("Yes")
        .removeClass("esper-red")
        .addClass("esper-green");
    }
    if (!prefs.use_duplicate_events) {
      useDuplicate.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");
    }
    if (!prefs.bcc_exec_on_reply) {
      bccExec.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");
    }
    container.append(view);
  }

  function displayGeneralPrefs(container : JQuery,
                               prefs : ApiT.GeneralPrefs,
                               changes) {
'''
<div #view>
  <div>
    <span>
      <object #bccNew class="esper-svg esper-new-preference-icon"/>
      Bcc exec:
    </span>
    <span class="esper-green" #bccExec>Yes</span>
  </div>
</ul>
'''
    if (getSubPreferenceChanges("Bcc", changes).length > 0) {
      bccNew.attr("data", Init.esperRootUrl + "img/new_pref.svg");
    }

    if (!prefs.bcc_exec_on_reply) {
      bccExec.text("No")
        .removeClass("esper-green")
        .addClass("esper-red");
    }

    container.append(view);
  }

  function displayTeamLabel(container : JQuery,
                            teamLabel : string) {
'''
<div #view>
  <span #label>
</div>
'''

    label.text(teamLabel);
    container.append(view);
  }

  function getSubPreferenceChanges(change_type : string,
                                   changes) {
    return List.filterMap(changes, function(change) {
      if (change[0] === change_type) {
        return change[1];
      } else {
        return null;
      }
    });
  }

  function getPreferencesChanges(change_type : string,
                                changes : ApiT.PreferenceChange[]) {
    return List.filterMap(changes, function(change) {
      if (change.change_type[0] === change_type) {
        return change.change_type[1];
      } else {
        return null;
      }
    });
  }

  export interface UserTabView {
    view: JQuery;
    user: JQuery;
    preferencesSpinner: JQuery;
    teamLabelsSection: JQuery;
    teamLabelsHeader: JQuery;
    showTeamLabels: JQuery;
    teamLabelsContainer: JQuery;
    coworkerSection: JQuery;
    coworkersHeader: JQuery;
    showCoworkers: JQuery;
    coworkersNew: JQuery;
    coworkersContainer: JQuery;
    coworkers: JQuery;
    calendarsSection: JQuery;
    calendarsHeader: JQuery;
    showCalendars: JQuery;
    calendarsContainer: JQuery;
    meetingsHeader: JQuery;
    showMeetings: JQuery;
    meetingsNew: JQuery;
    meetingsContainer: JQuery;
    meetingsSelector: JQuery;
    meetingSelector: JQuery;
    noMeetingPrefs: JQuery;
    meetingInfo: JQuery;
    notesHeader: JQuery;
    showNotes: JQuery;
    notesNew: JQuery;
    notesContainer: JQuery;
    notes: JQuery;
  }

  export function viewOfUserTab(team: ApiT.Team): UserTabView {
'''
<div #view class="esper-tab-flexbox">
  <div #user class="esper-tab-header"/>
  <div class="esper-tab-overflow">
    <div #preferencesSpinner class="esper-events-list-loading">
      <div class="esper-spinner esper-list-spinner"/>
    </div>
    <div class="esper-section">
      <div #meetingsHeader
           class="esper-section-header esper-clearfix esper-meetings-header">
        <span #showMeetings
              class="esper-link esper-meetings" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">Meetings</span>
        <span #meetingsNew class="esper-new-marker">NEW</span>
      </div>
      <div #meetingsContainer
           class="esper-section-container esper-meetings-container"
           style="display:none">
        <div #meetingsSelector class="esper-section-selector esper-clearfix">
          <span class="esper-show-selector">Show: </span>
          <select #meetingSelector class="esper-select esper-meeting-selector"/>
        </div>
        <div #noMeetingPrefs style="display: none" class="esper-no-prefs"/>
        <div class="esper-user-tab-meeting-info" #meetingInfo/>
      </div>
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
        <span #coworkersNew class="esper-new-marker">NEW</span>
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
    <div #notesSection class="esper-section">
      <div #notesHeader class="esper-section-header esper-clearfix">
        <span #showNotes
              class="esper-link" style="float:right">Show</span>
        <span class="esper-bold" style="float:left">User Notes</span>
        <span #notesNew class="esper-new-marker">NEW</span>
      </div>
      <div #notesContainer class="esper-section-container" style="display:none">
        <pre #notes class="esper-preferences-notes"/>
      </div>
    </div>
    <div class="esper-section" style="text-align: center">
      <a #morePrefsLink class="esper-link">
        Click here to view and edit additional preferences
      </a>
    </div>
  </div>
</div>
'''
    var noPrefsURL = Conf.Api.url + "/#!team-settings/" + team.teamid;
    var noPrefsLink = $("<a href='" + noPrefsURL + "'>Edit settings?</a>");
    noPrefsLink.addClass("esper-link");
    var noPrefsDescr = $("<span>Executive is marked unavailable " +
                         "for this meeting type. </span>");
    noMeetingPrefs.append(noPrefsDescr).append(noPrefsLink);
    morePrefsLink.attr("href", noPrefsURL);

    var prefs = Teams.getTeamPreferences(team);
    var until = Math.floor(XDate.now()/1000);
    var from = until - 432000; // 5 days

    meetingsNew.hide();
    coworkersNew.hide();
    notesNew.hide();
    Api.getPreferenceChanges(team.teamid, from, until).done(function(changes) {
      var workplace_changes =
        getPreferencesChanges("Workplace", changes.change_log);
      var meeting_changes =
        getPreferencesChanges("Meeting", changes.change_log);
      var coworkers_changes =
        getPreferencesChanges("Coworkers", changes.change_log);
      var notes_changes =
        getPreferencesChanges("Notes", changes.change_log);

      if (workplace_changes.length + meeting_changes.length > 0) {
        meetingsNew.show();
      }
      if (coworkers_changes.length > 0) {
        coworkersNew.show();
      }
      if (notes_changes.length > 0) {
        notesNew.show();
      }
      preferencesSpinner.hide();

      user.append(viewOfUser(team, prefs));

      var meetingTypes = prefs.meeting_types;
      var workplaces = prefs.workplaces;
      populateMeetingsDropdown(meetingSelector, meetingInfo, noMeetingPrefs,
                               meetingTypes, workplaces,
                               meeting_changes, workplace_changes);

      // If we have a workplace, display that as the starting choice.
      if (workplaces.length > 0) {
        meetingSelector.val("0");
      }

      meetingSelector.change(); // ensure this section is initialized correctly

      // NB: Triggering click event is a bit hacky since meetings show always
      // start open, but this should be fine for now.
      showMeetings.click();

      if (team.team_labels.length > 0) {
        team.team_labels.forEach(function(label) {
          displayTeamLabel(teamLabelsContainer, label);
        });
        showTeamLabels.click();
      } else {
        teamLabelsSection.hide();
      }

      if (prefs.coworkers) {
        coworkers.text(prefs.coworkers);
        showCoworkers.click();
      } else {
        coworkerSection.hide()
      }

      if (prefs.notes && prefs.notes.trim()) {
        notes.text(prefs.notes);
        showNotes.click();
      } else {
        notesSection.hide();
      }
    });

    Sidebar.customizeSelectArrow(meetingSelector);

    showCalendars.click(function() {
      Sidebar.toggleList(calendarsContainer);
      if (showCalendars.text() === "Hide") {
        showCalendars.text("Show");
        calendarsHeader.removeClass("esper-open");
      } else {
        showCalendars.text("Hide");
        calendarsHeader.addClass("esper-open");
      }
    });

    showMeetings.click(function() {
      Sidebar.toggleList(meetingsContainer);
      if (showMeetings.text() === "Hide") {
        showMeetings.text("Show");
        meetingsHeader.removeClass("esper-open");
      } else {
        showMeetings.text("Hide");
        meetingsHeader.addClass("esper-open");
      }
    });

    showTeamLabels.click(function() {
      Sidebar.toggleList(teamLabelsContainer);
      if (showTeamLabels.text() === "Hide") {
        showTeamLabels.text("Show");
        teamLabelsHeader.removeClass("esper-open");
      } else {
        showTeamLabels.text("Hide");
        teamLabelsHeader.addClass("esper-open");
      }
    });

    showCoworkers.click(function() {
      Sidebar.toggleList(coworkersContainer);
      if (showCoworkers.text() === "Hide") {
        showCoworkers.text("Show");
        coworkersHeader.removeClass("esper-open");
      } else {
        showCoworkers.text("Hide");
        coworkersHeader.addClass("esper-open");
      }
    });

    showNotes.click(function() {
      Sidebar.toggleList(notesContainer);
      if (showNotes.text() === "Hide") {
        showNotes.text("Show");
        notesHeader.removeClass("esper-open");
      } else {
        showNotes.text("Hide");
        notesHeader.addClass("esper-open");
      }
    });

    return _view;
  }

}
