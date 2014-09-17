module Esper.Tab3Content {

  function textOfAvailability(availabilities) {
    var text = "";
    List.iter(availabilities, function(a : ApiT.Availability) {
      text += [
        a.avail_from.day.slice(0, 5),
        a.avail_from.time.slice(0, 5), "to",
        a.avail_to.day.slice(0, 5),
        a.avail_to.time.slice(0, 5)
      ].join(" ") + "; ";
    });
    return text === "" ? text : text.slice(0, -2);
  }

  function displayWorkplace(workInfo, workplace) {
'''
<div #view>
  <div #loc class="esper-location">Location: </div>
  <div #duration class="esper-duration">Duration: </div>
  <div #availability class="esper-availability">Availability: </div>
</div>
'''
    loc.append(workplace.location.address);
    var atWork = Number(workplace.duration / 60 / 60).toFixed(2);
    duration.append(atWork + " hours");
    availability.append(textOfAvailability(workplace.availability));
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
