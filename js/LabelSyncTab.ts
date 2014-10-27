/*
  Team Settings - LabelSync Tab
*/

module LabelSyncTab {

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

  function viewOfLabelRow(team, label, syncedLabelsList) {
'''
<li #row class="table-row labels-table clearfix">
  <div #labelText class="col-xs-5"/>
  <div #status class="col-xs-4">
    <div #dot class="sync-status-dot"/>
    <span #statusText class="gray"/>
  </div>
  <div class="col-xs-3 sync-action">
    <a #action href="#" class="link"/>
  </div>
</li>
'''
    labelText.text(label);

    function disable() {
      status.css("opacity", "0.5");
      action
        .css("opacity", "0.5")
        .css("pointer-events", "none");
    }

    function enable() {
      status.css("opacity", "1");
      action
        .css("opacity", "1")
        .css("pointer-events", "auto");
    }

    function showSyncing() {
      enable();
      dot.css("background", "#2bb673");
      statusText.text("Syncing");
      action.text("Stop syncing");
    }

    function showNotSyncing() {
      enable();
      dot.css("background", "#d9534f");
      statusText.text("Not syncing");
      action.text("Sync");
    }

    function toggleSync() {
      disable();
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        if (List.mem(syncedLabels.labels, label)) {
          var index = syncedLabels.labels.indexOf(label);
          if (index != undefined) {
            syncedLabels.labels.splice(index, 1);
          }
          Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showNotSyncing(); });
        } else {
          syncedLabels.labels.push(label);
          Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showSyncing(); });
        }
      });
    }

    if (List.mem(syncedLabelsList, label))
      showSyncing();
    else
      showNotSyncing();

    action.click(toggleSync);

    return row;
  }

  export function load(team) {
'''
<div #view>
  <div class="esper-tab-description clearfix">
    <div #labelSyncContainer class="img-container-left"/>
    <div #description class="label-sync-description"/>
  </div>
  <div class="table-header">Shared Labels</div>
  <ul #labels class="table-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="clearfix">
    <div #labelIconContainer class="img-container-left"/>
    <a #create disabled
       class="link popover-trigger click-safe"
       style="float:left">Create new shared label</a>
  </div>
  <div #newLabelPopover class="new-label-popover overlay-popover click-safe">
    <div class="overlay-popover-header click-safe">New shared label</div>
    <div class="overlay-popover-body click-safe">
      <input #newLabel class="new-label-input click-safe"
             autofocus placeholder="Untitled label"/>
      <div class="clearfix click-safe">
        <div #error class="new-label-error click-safe">
          This label already exists.</div>
        <button #cancel class="button-secondary label-btn">Cancel</button>
        <button #save class="button-primary label-btn click-safe"
                disabled>Save</button>
        <div #inlineSpinner class="spinner inline-spinner"/>
    </div>
  </div>
</div>
'''
    var labelSync = $("<img class='svg-block label-sync-icon'/>")
      .appendTo(labelSyncContainer);
    Svg.loadImg(labelSync, "/assets/img/LabelSync.svg");

    var labelIcon = $("<img class='svg-block label-icon'/>")
      .appendTo(labelIconContainer);
    Svg.loadImg(labelIcon, "/assets/img/new-label.svg");

    description
      .text("LabelSync lets you share email labels across your team. Below " +
        "are labels that currently appear in every team member's account.");

    tableSpinner.show();

    // local array for keyup function
    var sharedLabelsList;

    Api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList = sharedLabels.labels;
        var allLabels =
          List.union(sharedLabels.labels, syncedLabels.labels, undefined);
        tableSpinner.hide();
        if (allLabels.length > 0) {
          labels.children().remove();
          allLabels.sort();
          List.iter(allLabels, function(label) {
            labels.append(viewOfLabelRow(team, label, syncedLabels.labels));
          });
        } else {
          tableEmpty.show();
        }
        create.click(function() {
          toggleOverlay(newLabelPopover);
          newLabel.focus();
        });
      });
    });

    newLabel.keyup(function() {
      Log.p(newLabel.val());
      if (newLabel.val() != "") {
        if (sharedLabelsList.indexOf(newLabel.val()) > -1) {
          save.attr("disabled", "true");
          error.css("display", "inline-block");
        } else {
          save.removeAttr("disabled");
          error.hide();
        }
      }
      else
        save.attr("disabled", "true");
    });

    save.click(function() {
      inlineSpinner.show();
      newLabel.addClass("disabled");
      save.attr("disabled", "true");
      var label = newLabel.val();
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList.push(label);
        syncedLabels.labels.push(label);
        Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
          .done(function() {
            inlineSpinner.hide();
            toggleOverlay(newLabelPopover);
            newLabel
              .val("")
              .removeClass("disabled");
            tableEmpty.hide();
            var newRow = viewOfLabelRow(team, label, syncedLabels.labels);
            labels.prepend(newRow);
            newRow.addClass("purple-flash");
          });
      });
    });

    cancel.click(function() {
      toggleOverlay(newLabelPopover);
      newLabel.val("");
      error.hide();
    })

    return view;
  }

}
