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
  <div class="exec-profile clearfix">
    <div #labelSyncContainer />
    <div #description class="label-sync-description"/>
  </div>
  <div class="table-header">Calls</div>
  <ul #labels class="table-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="table-header">Food & Drinks</div>
  <ul #labels class="table-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="table-header">Other</div>
  <ul #labels class="table-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  </div>
</div>
'''

    return view;
  }

}
