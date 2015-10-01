/*
  Team Settings - Labels Tab
*/

module Esper.LabelsTab {

  function renderLabelDialog(team, table, teamLabels) {
'''
<div #view class="new-label-popover overlay-popover click-safe">
  <div class="overlay-popover-header click-safe">New team label</div>
  <div class="overlay-popover-body click-safe">
    <input #newLabel type="text" class="new-label-input click-safe"
           autofocus placeholder="Untitled label"/>
    <div class="clearfix click-safe">
      <div #error class="new-label-error click-safe">
        This label already exists.</div>
      <button #save class="button-primary label-btn click-safe"
              disabled>Save</button>
      <div #inlineSpinner class="spinner inline-spinner"/>
      <button #cancel class="button-secondary label-btn">Cancel</button>
  </div>
</div>
'''
    newLabel.keyup(function() {
      if (newLabel.val() != "") {
        if (teamLabels.indexOf(newLabel.val()) > -1) {
          save.prop("disabled", true);
          error.css("display", "inline-block");
        } else {
          save.prop("disabled", false);
          error.hide();
        }
      }
      else
        save.prop("disabled", true);
    });

    save.click(function() {
      inlineSpinner.show();
      save.hide();
      cancel.hide();
      newLabel.addClass("disabled");
      save.attr("disabled", "true");
      var label = newLabel.val();
      Api.getSyncedLabels(team.teamid).done(function(response) {
        teamLabels.push(label);
        response.labels.push(label);
        Api.putSyncedLabels(team.teamid, { labels: response.labels })
          .done(function() {
            view.addClass("reset");
            Settings.togglePopover(_view);
            table.tableEmpty.hide();
            var newRow = viewOfLabelRow(team, label);
            table.labels.prepend(newRow);
            newRow.addClass("purple-flash");
          });
      });
    });

    cancel.click(function() { Settings.togglePopover(_view); });

    return _view;
  }

  function viewOfLabelRow(team, label) {
'''
<li #row class="table-row labels-table clearfix">
  <div #labelText class="col-xs-5"/>
  <div #status class="col-xs-4"/>
  <div class="col-xs-3 sync-action">
    <span #action href="#" class="link danger">Remove</span>
  </div>
</li>
'''
    labelText.text(label);

    function disable() {
      labelText.css("opacity", "0.5");
      action
        .css("opacity", "0.5")
        .css("pointer-events", "none");
    }

    function removeLabel() {
      disable();
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        var index = syncedLabels.labels.indexOf(label);
        if (index != -1) {
          syncedLabels.labels.splice(index, 1);
        }
        Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
          .done(function() { row.remove(); });
      });
    }

    action.click(removeLabel);

    return row;
  }

  export function load(team) {
'''
<div #view>
  <div class="table-header">Team Labels</div>
  <ul #labels class="table-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">No labels are set for this team.</div>
  </ul>
  <div class="clearfix">
    <div #labelIconContainer class="img-container-left"/>
    <a #create disabled
       class="link popover-trigger click-safe"
       style="float:left">Add a team label</a>
  </div>
</div>
'''
    var labelIcon = $("<img class='svg-block label-icon'/>")
      .appendTo(labelIconContainer);
    Svg.loadImg(labelIcon, "/assets/img/new-label.svg");

    tableSpinner.show();

    var teamLabels;

    Api.getSyncedLabels(team.teamid).done(function(response) {
      teamLabels = response.labels;
      tableSpinner.hide();
      if (teamLabels.length > 0) {
        labels.children().remove();
        teamLabels.sort();
        List.iter(teamLabels, function(label) {
          labels.append(viewOfLabelRow(team, label));
        });
      } else {
        tableEmpty.show();
      }
      var popover = renderLabelDialog(team, _view, teamLabels);
      view.append(popover.view);
      create.click(function() {
        popover.newLabel.val("");
        Settings.togglePopover(popover);
      });
    });

    return view;
  }

}
