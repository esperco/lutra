/*
  Manage batch label changes
*/

module Esper.Actions.BatchGroupLabels {

  // Simple store for sole purpose of tracking status updates
  var Store = new Model2.Store<string, {}>({ cap: 100 });

  // Queue a batch label change
  export function rename(groupId: string, oldLabel: string, newLabel: string) {
    Analytics.track(Analytics.Trackable.RenameGroupLabel, {
      _id: groupId,
      oldLabel: oldLabel,
      newLabel: newLabel
    });

    return queueBatchLabelUpdate(groupId, oldLabel, {
      addLabels: [newLabel.trim()],
      removeLabels: [oldLabel]
    });
  }

  export function remove(groupId: string, label: string) {
    Analytics.track(Analytics.Trackable.DeleteTimeStatsLabel, {
      _id: groupId,
      label: label
    });
    return queueBatchLabelUpdate(groupId, label, {
      removeLabels: [label]
    });
  }

  export function getStatus(groupId: string) {
    return Store.get(groupId)
      .mapOr(Model2.DataStatus.READY, (m) => m.dataStatus);
  }

  function queueBatchLabelUpdate(groupId: string, label: string, opt: {
    addLabels?: string[], removeLabels?: string[]
  }) {
    var req: ApiT.LabelChangeRequest = { selection: ["Label", label] };
    if (opt.removeLabels) {
      req.remove_labels = opt.removeLabels;
    }
    if (opt.addLabels) {
      req.add_labels = opt.addLabels;
    }

    var p = BatchQueue.enqueue(groupId, {
      groupId: groupId,
      request: req
    });
    Store.push(groupId, p, Option.none<{}>());
  }

  interface QueueRequest {
    groupId: string;
    request: ApiT.LabelChangeRequest;
  };

  var BatchQueue = new Queue2.Processor(
    // Processor
    function(r: QueueRequest) {
      return Api.changeGroupEventLabels(r.groupId, r.request);
    },

    // Pre-processor
    function(requests: QueueRequest[]) {
      var next = requests.shift();

      // Filter out redundant requests, while adding them to the combined
      // request
      requests = _.filter(requests, (r) => {
        if (r.groupId === next.groupId &&
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
