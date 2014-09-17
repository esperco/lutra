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

  function displayAvailability(view, availabilities) {
    List.iter(availabilities, function(a : ApiT.Availability) {
      var text = formatTimeRange(a.avail_from.day, a.avail_from.time,
                                 a.avail_to.day, a.avail_to.time);
      $("<li>" + text + "</li>")
        .appendTo(view);
    });
  }

  function displayWorkplace(workInfo, workplace) {
'''
<div #view>
  <div #loc class="esper-location">Location: </div>
  <div #duration class="esper-duration">Duration: </div>
  <div class="esper-availability">Availability:
    <ul #avail />
  </div>
</div>
'''
    loc.append(workplace.location.address);
    var atWork = Number(workplace.duration / 60 / 60).toFixed(2);
    duration.append(atWork + " hours");
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

  export function displayPreferencesTab(tab3, team, profiles) {
'''
<div #view>
  <div #linkActions class="esper-tab-header"/>
  <div #preferences class="esper-preferences">
    <div #workplaces class="esper-workplaces">
      <select #drop class="esper-workplace-dropdown"/>
      <div #workInfo class="esper-workplace-info"/>
    </div>
  </div>
  <div #events class="esper-linked-events"/>
</div>
'''
    Api.getPreferences(team.teamid).done(function(prefs) {
      Log.d("PREFERENCES:");
      Log.d(prefs);
      var workplaces = prefs.workplaces;
      populateWorkplaceDropdown(drop, workInfo, workplaces);
      if (workplaces.length > 0) displayWorkplace(workInfo, workplaces[0]);
    });

    tab3.append(view);
  }

}
