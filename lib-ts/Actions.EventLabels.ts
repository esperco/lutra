/*
  Module for applying labels to events
*/

/// <reference path="./Queue2.ts" />
/// <reference path="./Stores.Events.ts" />

module Esper.Actions.EventLabels {

  export function add(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, { addLabels: [label] });
  }

  export function remove(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, { removeLabels: [label] });
  }

  // Confirm any predicted labels
  export function confirm(events: Stores.Events.TeamEvent[]) {
    // Only confirm if score < 1 (don't ned to confirm user labels)
    events = _.filter(events, (e) => e.labelScores.match({
      none: () => false,
      some: (l) => l[0] && l[0].score < 1
    }));
    if (events.length > 0) {
      apply(events, {});
    }
  }

  function apply(events: Stores.Events.TeamEvent[], opts: {
    addLabels?: string[];
    removeLabels?: string[];
  }) {
    var eventsByTeamId = _.groupBy(events, (e) => e.teamId);
    _.each(eventsByTeamId, (teamEvents, teamId) => {
      applyForTeam(teamId, teamEvents, opts);

      // Only fire analytics call if add/remove, not if confirming
      if (opts.addLabels || opts.removeLabels) {
        Analytics.track(Analytics.Trackable.EditEventLabels, {
          numEvents: teamEvents.length,
          teamIds: teamId
        });
      }
    });
  }

  function applyForTeam(teamId: string, events: Stores.Events.TeamEvent[],
    opts: {
      addLabels?: string[];
      removeLabels?: string[];
    })
  {
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

    // Modify events
    var newEvents = _.map(events, (e) => {
      var newEvent = _.cloneDeep(e);
      newEvent.labelScores = Option.some(getNewLabels(e, opts));
      return newEvent;
    });
    var p = TeamLabelQueue.enqueue(teamId, {
      teamId: teamId,
      events: newEvents
    });

    // Wrap the whole kaboodle in a transaction
    Stores.Events.EventStore.transact(() => {
      Stores.Events.EventStore.transactP(p, (tP) => {
        _.each(newEvents, (e) => {
          var storeId = Stores.Events.storeId(e);
          Stores.Events.EventStore.push(storeId, tP, Option.wrap(e));
        });
      });
    });
  }

  function getNewLabels(event: Stores.Events.TeamEvent, opts: {
    addLabels?: string[];
    removeLabels?: string[];
  }) {
    var labels = _.cloneDeep(Stores.Events.getLabels(event));
    _.each(opts.addLabels, (l) => {
      let normalized = Stores.Teams.getNormLabel(l);
      if (! _.find(labels, (l) => l.id === normalized)) {
        labels.push({
          id: normalized,
          displayAs: l,
          score: 1
        });
      }
    });

    _.each(opts.removeLabels, (l) => {
      let normalized = Stores.Teams.getNormLabel(l);
      _.remove(labels, (l) => l.id === normalized);
    });

    // Predicted labels are now confirmed
    _.each(labels, (l) => l.score = 1);

    return labels;
  }


  interface QueueRequest {
    teamId: string;
    events: Stores.Events.TeamEvent[];
  };

  var TeamLabelQueue = new Queue2.Processor(
    // Processor
    function(r: QueueRequest) {
      return Api.setPredictLabels(r.teamId, {
        set_labels: _.map(r.events, (e) => ({
          id: e.recurringEventId || e.id,
          labels: e.labelScores.match({
            none: (): string[] => [],
            some: (scores) => _.map(scores, (s) => s.displayAs)
          })
        })),
        predict_labels: [] // Leave blank for now
      });
    },

    // Pre-processor
    function(requests: QueueRequest[]) {
      var next = requests.shift();

      // Filter out redundant requests, while adding them to the combined
      // request
      requests = _.filter(requests, (r) => {
        if (r.teamId === next.teamId) {
          // Ensure next (latter action) takes precedence
          next.events = _.uniqBy(r.events.concat(next.events), (e) => e.id);
          return false;
        }
        return true;
      });

      requests.unshift(next);
      return requests;
    });
}
