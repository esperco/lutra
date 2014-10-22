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

  export function load(team) {
'''
<div #view>
  <div class="table-header">Calls</div>
  <ul #callsPreferences class="table-list">
    <div #callsTableSpinner class="spinner table-spinner"/>
    <div #callsTableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="table-header">Food & Drinks</div>
  <ul #foodPreferences class="table-list">
    <div #foodTableSpinner class="spinner table-spinner"/>
    <div #foodTableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="table-header">Other</div>
  <ul #otherPreferences class="table-list">
    <div #otherTableSpinner class="spinner table-spinner"/>
    <div #otherTableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  </div>
</div>
'''

    return view;
  }

}
