/*
  Team Settings - Labels Tab
*/

module Esper.LabelsTab {

  function renderLabelDialog(team, table, teamLabels: string[]) {
'''
<div #view>
  <div class="overlay-popover-header click-safe">
    <i class="fa fa-fw fa-tags"></i>
    Add New Labels (Separate by Comma)
  </div>
  <div class="overlay-popover-body click-safe">
    <input #newLabel type="text" class="new-label-input click-safe"
           autofocus placeholder="My First Label, My Second Label"/>
    <div class="clearfix click-safe">
      <div #error class="new-label-error click-safe">
        This label already exists.</div>
      <button #save class="button-primary label-btn click-safe"
              disabled>Save</button>
      <div #inlineSpinner class="spinner inline-spinner"/>
  </div>
</div>
'''
    newLabel.keyup(function(e) {
      if (newLabel.val() !== "") {
        if (hasDuplicateLabels()) {
          save.prop("disabled", true);
          error.css("display", "inline-block");
        }
        else {
          save.prop("disabled", false);
          error.hide();

          if (e.keyCode === 13) { // Enter
            e.stopPropagation();
            saveLabels();
          }
        }
      }
      else
        save.prop("disabled", true);
    });

    function hasDuplicateLabels() {
      var labelVal: string = newLabel.val() || "";
      var labels = _.map(labelVal.split(","), function(l) {
        return l.trim().toLowerCase();
      });
      var existing = _.map(teamLabels, function(l) {
        return l.trim().toLowerCase();
      });
      return _.intersection(labels, existing).length > 0;
    }

    function saveLabels() {
      inlineSpinner.show();
      save.hide();
      save.prop("disabled", true);
      newLabel.prop("disabled", true);
      var labels = (newLabel.val() || "").split(",");
      Api.getSyncedLabels(team.teamid).done(function(response) {
        _.each(labels, function(label: string) {
          label = label.trim();
          teamLabels.push(label);
          response.labels.push(label);
        });
        Api.putSyncedLabels(team.teamid, { labels: response.labels })
          .done(function() {
            inlineSpinner.hide();
            save.show();
            save.prop("disabled", false);
            newLabel.prop("disabled", false);
            newLabel.val("");
            table.tableEmpty.hide();
            _.each(labels, function(label: string) {
              var newRow = viewOfLabelRow(team, label);
              table.labels.prepend(newRow);
              newRow.addClass("purple-flash");
            });
          });
      });
    }

    save.click(saveLabels);

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
</div>
'''
    tableSpinner.show();

    var teamLabels: string[];

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
    });

    return view;
  }

}
