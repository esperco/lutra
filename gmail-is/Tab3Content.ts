/* Executive scheduling preferences */

module Esper.Tab3Content {

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
<div #view>
  <div #loc>Location: </div>
  <div #duration>Duration: </div>
  <div>
    Availability: <ul #avail/>
  </div>
</div>
'''
    loc.append(workplace.location.address);
    duration.append(formatDuration(workplace.duration));
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
<div #view>
  <div #duration>Duration: </div>
  <div>
    Availability: <ul #avail/>
  </div>
  <div>
    Phone numbers: <ul #phones/>
  </div>
</div>
'''
    duration.append(formatDuration(phonePrefs.duration));
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

  export function displayPreferencesTab(tab3, team, profiles) {
'''
<div #view>
  <div #preferences>
    <div #workplaces>
      Workplace: <select #workDrop/>
      <div #workInfo/>
    </div>
    <hr/>
    <div #meetings>
      <select #meetDrop>
        <option value="header">Select meeting type...</option>
      </select>
      <div #meetInfo/>
    </div>
    <hr/>
    <div>
      Notes: <pre #notes/>
    </div>
  </div>
</div>
'''
    Api.getPreferences(team.teamid).done(function(prefs) {
      var workplaces = prefs.workplaces;
      populateWorkplaceDropdown(workDrop, workInfo, workplaces);
      if (workplaces.length > 0)
        displayWorkplace(workInfo, workplaces[0]);

      var meetingTypes = prefs.meeting_types;
      populateMeetingsDropdown(meetDrop, meetInfo, meetingTypes);

      notes.text(prefs.notes);
      notes.css("white-space", "pre-wrap");
    });

    tab3.append(view);
  }

}
