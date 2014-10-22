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

  function toggleSwitch(toggleBg, toggleSwitch) {
    if (toggleBg.hasClass("on")) {
      toggleBg.removeClass("on");
      toggleBg.addClass("off");
      toggleSwitch.removeClass("on");
      toggleSwitch.addClass("off");
    } else {
      toggleBg.addClass("on");
      toggleBg.removeClass("off");
      toggleSwitch.addClass("on");
      toggleSwitch.removeClass("off");
    }
  }

  function viewOfFoodAndDrinksPreferences(teamid) {
'''
<ul #view class="table-list">
  <li #breakfast class="preference left">
  </li>
  <li #brunch class="preference">
  </li>
  <li #lunch class="preference left">
  </li>
  <li #coffee class="preference">
  </li>
  <li #dinner class="preference left">
  </li>
  <li #drinks class="preference">
  </li>
</div>
'''
    return view;
  }

  function viewOfCallsPreferences(teamid) {
'''
<ul #view class="table-list">
  <li #phone class="preference left">
    <div #phoneToggle>
      <div #phoneToggleBg class="preference-toggle-bg on"/>
      <div #phoneToggleSwitch class="preference-toggle-switch on"/>
    </div>
  </li>
  <li #video class="preference">
    <div #videoToggle>
      <div #videoToggleBg class="preference-toggle-bg on"/>
      <div #videoToggleSwitch class="preference-toggle-switch on"/>
    </div>
  </li>
</div>
'''


    phoneToggle.click(function() { toggleSwitch(phoneToggleBg, phoneToggleSwitch) });
    videoToggle.click(function() { toggleSwitch(videoToggleBg, videoToggleSwitch) });

    return view;
  }

  export function load(team) {
'''
<div #view>
  <div #calls>
    <div class="table-header">Calls</div>
  </div>
  <div #foodAndDrinks>
    <div class="table-header">Food & Drinks</div>
  </div>
  </div>
</div>
'''
    calls.append(viewOfCallsPreferences(team.teamid));
    foodAndDrinks.append(viewOfFoodAndDrinksPreferences(team.teamid));
    return view;
  }

}
