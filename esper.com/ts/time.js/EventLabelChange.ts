/*
  Module for applying labels to events
*/

/// <refernece path="../lib/Api.ts" />
/// <reference path="../lib/Model.Capped.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/Queue2.ts" />
/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="./Events2.ts" />

module Esper.EventLabelChange {

  export function add(events: Events2.TeamEvent[], label: string) {
    apply(events, { addLabels: [label] })
  }

  export function remove(events: Events2.TeamEvent[], label: string) {
    apply(events, { removeLabels: [label] })
  }

  export function apply(events: Events2.TeamEvent[], opts: {
    addLabels?: string[];
    removeLabels?: string[];
  }) {
    var eventsByTeamId = _.groupBy(events, (e) => e.teamId);
    _.each(eventsByTeamId, (teamEvents, teamId) => {
      applyForTeam(teamId, teamEvents, opts);
    });
  }

  function applyForTeam(teamId: string, events: Events2.TeamEvent[], opt: {
    addLabels?: string[];
    removeLabels?: string[];
  }) {
    var eventIds = _.map(events, (e) => e.recurring_event_id || e.id);
    var req: ApiT.LabelChangeRequest = { selection: ["Eventids", eventIds] };
    if (opt.removeLabels) {
      req.remove_labels = opt.removeLabels;
    }
    if (opt.addLabels) {
      req.add_labels = opt.addLabels;
    }

    var p = TeamLabelQueue.enqueue(teamId, {
      teamId: teamId,
      request: req
    });
    p.done(() => {
      TimeStats.StatStore.reset();
    });

    // Include recurring events
    const recurring = "r";
    const notRecurring = "n";
    var eventGroups = _.groupBy(events,
      (e) => e.recurring_event_id ? recurring : notRecurring
    );
    var events = eventGroups[notRecurring] || [];
    if ((eventGroups[recurring] || []).length) {
      var recurringEventIds = _.map(eventGroups[recurring],
        (e) => e.recurring_event_id
      );
      events = events.concat(
        _(Events2.EventStore.all())
          .filter((d) => d.data.match({
            none: () => false,
            some: (e) => _.includes(recurringEventIds, e.recurring_event_id)
          }))
          .map((d) => d.data.unwrap())
          .value()
      );
    }

    // Wrap the whole kaboodle in a transaction
    Events2.EventStore.transact(() => {
      Events2.EventStore.transactP(p, (tP) => {
        _.each(events, (e) => {
          var storeId = Events2.storeId(e);

          var eventOpt = Events2.EventStore.cloneData(storeId).flatMap(
            (newEvent) => {
              _.each(opt.addLabels, (l) => {
                var normalized = Teams.getNormLabel(l);
                if (! _.includes(newEvent.labels_norm, normalized)) {
                  newEvent.labels_norm.push(normalized);
                  newEvent.labels.push(l);
                }
              });

              _.each(opt.removeLabels, (l) => {
                var normalized = Teams.getNormLabel(l);
                var index = _.indexOf(newEvent.labels_norm, normalized);
                if (index >= 0) {
                  newEvent.labels.splice(index, 1);
                  newEvent.labels_norm.splice(index, 1);
                }
              });

              return Option.wrap(newEvent);
            });

          Events2.EventStore.push(storeId, tP, eventOpt);
        });
      });
    });
  }


  interface QueueRequest {
    teamId: string;
    request: ApiT.LabelChangeRequest
  };

  var TeamLabelQueue = new Queue2.Processor(
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
