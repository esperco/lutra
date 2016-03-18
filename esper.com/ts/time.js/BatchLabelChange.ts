/*
  Manage batch label changes
*/

/// <refernece path="../lib/Api.ts" />
/// <reference path="../lib/Model.Capped.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="../common/Analytics.Web.ts" />

module Esper.BatchLabelChange {

  // Not storing anything -- just using to track status of batch updates
  // for a given team
  var Store = new Model.CappedStore<{}>();

  // Queue a batch label change
  export function rename(teamId: string, oldLabel: string, newLabel: string) {
    Analytics.track(Analytics.Trackable.RenameTimeStatsLabel, {
      _id: teamId,
      oldLabel: oldLabel,
      newLabel: newLabel
    });

    return queueBatchLabelUpdate(teamId, oldLabel, {
      addLabels: [newLabel.trim()],
      removeLabels: [oldLabel]
    });
  }

  export function remove(teamId: string, label: string) {
    Analytics.track(Analytics.Trackable.DeleteTimeStatsLabel, {
      _id: teamId,
      label: label
    });
    return queueBatchLabelUpdate(teamId, label, {
      removeLabels: [label]
    });
  }

  export function getStatus(teamId: string) {
    return Option.cast(Store.metadata(teamId))
      .match({
        none: () => Model.DataStatus.READY,
        some: (m) => m.dataStatus
      });
  }

  function queueBatchLabelUpdate(teamId: string, label: string, opt: {
    addLabels?: string[], removeLabels?: string[]
  }) {
    var req: ApiT.LabelChangeRequest = { selection: ["Label", label] };
    if (opt.removeLabels) {
      req.remove_labels = opt.removeLabels;
    }
    if (opt.addLabels) {
      req.add_labels = opt.addLabels;
    }

    var p = Queue.enqueue("team-label-change-" + teamId,
      () => Api.changeEventLabels(teamId, req)
    );
    p.done(() => {
      TimeStats.StatStore.reset();
      Events.invalidate();
    });
    Store.push(teamId, p, {});
  }
}
