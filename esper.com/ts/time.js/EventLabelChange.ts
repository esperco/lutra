/*
  Module for applying labels to events
*/

module Esper.EventLabelChange {

  export function add(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, { addLabels: [label] })
  }

  export function remove(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, { removeLabels: [label] })
  }

  export function apply(events: Stores.Events.TeamEvent[], opts: {
    addLabels?: string[];
    removeLabels?: string[];
  }) {
    var eventsByTeamId = _.groupBy(events, (e) => e.teamId);
    _.each(eventsByTeamId, (teamEvents, teamId) => {
      applyForTeam(teamId, teamEvents, opts);
    });
  }

  function applyForTeam(teamId: string, events: Stores.Events.TeamEvent[],
    opt: {
      addLabels?: string[];
      removeLabels?: string[];
    })
  {
    var eventIds = _.map(events, (e) => e.recurringEventId || e.id);
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

    // Include recurring events
    const recurring = "r";
    const notRecurring = "n";
    var eventGroups = _.groupBy(events,
      (e) => e.recurringEventId ? recurring : notRecurring
    );
    var events = eventGroups[notRecurring] || [];
    if ((eventGroups[recurring] || []).length) {
      var recurringEventIds = _.map(eventGroups[recurring],
        (e) => e.recurringEventId
      );
      events = events.concat(
        _(Stores.Events.EventStore.all())
          .filter((d) => d.data.match({
            none: () => false,
            some: (e) => _.includes(recurringEventIds, e.recurringEventId)
          }))
          .map((d) => d.data.unwrap())
          .value()
      );
    }

    // Wrap the whole kaboodle in a transaction
    Stores.Events.EventStore.transact(() => {
      Stores.Events.EventStore.transactP(p, (tP) => {
        _.each(events, (e) => {
          var storeId = Stores.Events.storeId(e);

          var eventOpt = Stores.Events.EventStore.cloneData(storeId).flatMap(
            (newEvent) => {
              _.each(opt.addLabels, (l) => {
                var normalized = Stores.Teams.getNormLabel(l);
                if (! _.includes(newEvent.labels_norm, normalized)) {
                  newEvent.labels_norm.push(normalized);
                  newEvent.labels.push(l);
                }
              });

              _.each(opt.removeLabels, (l) => {
                var normalized = Stores.Teams.getNormLabel(l);
                var index = _.indexOf(newEvent.labels_norm, normalized);
                if (index >= 0) {
                  newEvent.labels.splice(index, 1);
                  newEvent.labels_norm.splice(index, 1);
                }
              });

              return Option.wrap(newEvent);
            });

          Stores.Events.EventStore.push(storeId, tP, eventOpt);
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
      var numEvents = Option.wrap(r.request.selection[1]).match({
        some: (s) => s.length,
        none: () => 0
      });
      Analytics.track(Analytics.Trackable.EditEventLabels, {
        numEvents: numEvents,
        teamId: r.teamId
      });
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
