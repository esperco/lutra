/*
  Manage batch label changes
*/

module Esper.Actions.BatchLabels {

  // Simple store for sole purpose of tracking status updates
  var Store = new Model2.Store<string, {}>({ cap: 100 });

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
    return Store.get(teamId)
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

    var p = BatchQueue.enqueue(teamId, {
      teamId: teamId,
      request: req
    });
    Store.push(teamId, p, Option.none<{}>());
  }

  interface QueueRequest {
    teamId: string;
    request: ApiT.LabelChangeRequest;
  };

  var BatchQueue = new Queue2.Processor(
    // Processor
    function(r: QueueRequest) {
      return Api.changeEventLabels(r.teamId, r.request);
    },

    // Pre-processor
    function(requests: QueueRequest[]) {
      var next = requests.shift();

      // Filter out redundant requests, while adding them to the combined
      // request
      requests = _.filter(requests, (r) => {
        if (r.teamId === next.teamId &&
            _.isEqual(r.request.selection, next.request.selection))
        {
          next.request.add_labels = _(next.request.add_labels)
            .difference(r.request.remove_labels)
            .union(r.request.add_labels)
            .value();

          next.request.remove_labels = _(next.request.remove_labels)
            .difference(r.request.add_labels)
            .union(r.request.remove_labels)
            .value();

          return false;
        }
        return true;
      });

      requests.unshift(next);
      return requests;
    });
}
