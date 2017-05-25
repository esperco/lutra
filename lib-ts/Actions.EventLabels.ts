/*
  Module for applying labels to events
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Stores.Events.ts" />

module Esper.Actions.EventLabels {

  export function add(events: Stores.Events.TeamEvent[],
                      label: Types.Label) {
    apply(events, {
      addLabels: [label]
    });
  }

  export function remove(events: Stores.Events.TeamEvent[],
                         label: Types.Label) {
    apply(events, {
      removeLabels: [label],
    });
  }

  // Confirm any predicted labels
  export function confirm(events: Stores.Events.TeamEvent[],
                          fetchEvents: Stores.Events.TeamEvent[] = [])
  {
    events = _.filter(events, Stores.Events.needsConfirmation);
    if (events.length > 0 || fetchEvents.length > 0) {
      apply(events, {
        fetchEvents: fetchEvents
      });
    }
  }

  // For paginated prediction, confirm and fetch new

  function apply(events: Stores.Events.TeamEvent[], opts: {
    addLabels?: Types.Label[];
    removeLabels?: Types.Label[];
    fetchEvents?: Types.TeamEvent[];
  }) {
    var eventsByTeamId = _.groupBy(events, (e) => e.teamId);
    var fetchEventsByTeamId = _.groupBy(opts.fetchEvents, (e) => e.teamId);
    var teamIds = _(eventsByTeamId)
      .keys()
      .concat(_.keys(fetchEventsByTeamId))
      .uniq()
      .value();

    _.each(teamIds, (teamId) => {
      var teamEvents = eventsByTeamId[teamId] || [];
      var teamFetchEvents = fetchEventsByTeamId[teamId];
      applyForTeam(teamId, teamEvents, {
        addLabels: opts.addLabels,
        removeLabels: opts.removeLabels,
        fetchEvents: teamFetchEvents
      });

      // Fire different analytics calls if add/remove vs. confirming
      if (opts.addLabels || opts.removeLabels) {
        Analytics.track(Analytics.Trackable.EditEventLabels, {
          numEvents: teamEvents.length,
          teamIds: teamId
        });
      } else {
        Analytics.track(Analytics.Trackable.ConfirmEventLabels, {
          numEvents: teamEvents.length,
          teamIds: teamId
        });
      }
    });
  }

  function applyForTeam(teamId: string, events: Stores.Events.TeamEvent[],
    opts: {
      addLabels?: Types.Label[];
      removeLabels?: Types.Label[];
      fetchEvents?: Types.TeamEvent[];
    })
  {
    // Include recurring events
    const recurring = "r";
    const notRecurring = "n";
    var eventGroups = _.groupBy(events,
      (e) => e.recurringEventId ? recurring : notRecurring
    );
    events = eventGroups[notRecurring] || [];
    if (! _.isEmpty(eventGroups[recurring])) {
      var recurringEventIds = _.map(eventGroups[recurring],
        (e) => e.recurringEventId
      );
      events = events.concat(
        _(Stores.Events.EventStore.all())
          .filter((d) => d.data.mapOr(
            false,
            (e) => _.includes(recurringEventIds, e.recurringEventId)
          ))
          .map((d) => d.data.unwrap())
          .value()
      );
    }

    // Modify events
    var newEvents = _.map(events, (e) => {
      var newEvent = _.cloneDeep(e);
      newEvent.confirmed = true;

      // Event labeling of any kind implies attendance
      if (Stores.Events.isActive(e) || opts.addLabels || opts.removeLabels) {
        newEvent.labels = Option.some(getNewLabels(e, opts));
        newEvent.attendScore = 1;
        newEvent.feedback = newEvent.feedback || {
          eventid: e.id,
          teamid: e.teamId
        };
        newEvent.feedback.attended = true;
      }

      // Not active -> confirm not attended
      else {
        newEvent.attendScore = 0;
        newEvent.feedback = newEvent.feedback || {
          eventid: e.id,
          teamid: e.teamId
        };
        newEvent.feedback.attended = false;
      }

      return newEvent;
    });

    /*
      Keep recurring events for store update purposes, but filter out
      recurring when passing to API call
    */
    var apiEvents = _.uniqBy(newEvents, (e) => e.recurringEventId || e.id);

    var p = TeamLabelQueue.enqueue(teamId, {
      teamId: teamId,
      events: apiEvents,
      fetchEventIds: _.map(opts.fetchEvents, (e) => e.id)
    });

    // Wrap the whole kaboodle in a transaction
    Stores.Events.EventStore.transact(() => {
      Stores.Events.EventStore.transactP(p, (tP) => {
        // Push confirmations
        _.each(newEvents, (e) => {
          let storeId = Stores.Events.storeId(e);
          Stores.Events.EventStore.push(storeId, tP, Option.wrap(e));
        });

        // Fetch any additional events requested
        _.each(opts.fetchEvents, (e) => {
          let storeId = Stores.Events.storeId(e);
          Stores.Events.EventStore.fetch(storeId, tP.then((p) => {
            var match = _.find(p.events, (newEvent) => newEvent.id === e.id);
            return match ?
              Option.some(Stores.Events.asTeamEvent(e.teamId, match)) :
              Option.none<Stores.Events.TeamEvent>();
          }));
        });
      });
    });
  }

  function getNewLabels(event: Stores.Events.TeamEvent, opts: {
    addLabels?: Types.Label[];
    removeLabels?: Types.Label[];
  }) {
    var labels = _.cloneDeep(Stores.Events.getLabels(event));
    var team = Stores.Teams.require(event.teamId);
    _.each(opts.addLabels, (label) => {
      if (! _.find(labels, (l) => l.id === label.id)) {
        labels.push({
          id: label.id,
          displayAs: label.displayAs,
          color: label.color
        });
      }
    });

    _.each(opts.removeLabels, (l) => {
      let normalized = l.id;
      _.remove(labels, (l) => l.id === normalized);
    });

    return labels;
  }


  interface QueueRequest {
    teamId: string;
    events: Stores.Events.TeamEvent[];
    fetchEventIds: string[];
  };

  var TeamLabelQueue = new Queue2.Processor(
    // Processor
    function(r: QueueRequest) {
      return Api.setPredictLabels(r.teamId, {
        set_labels: _.map(r.events, (e) => Stores.Events.isActive(e) ?
          {
            id: e.recurringEventId || e.id,
            labels: e.labels.mapOr([],
              (labels) => _.map(labels, (l) => l.displayAs)
            ),
            attended: true
          } : {
            id: e.recurringEventId || e.id,
            attended: false
          }),
        predict_labels: r.fetchEventIds
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
          next.events = _.uniqBy(r.events.concat(next.events),
            (e) => e.recurringEventId || e.id
          );
          next.fetchEventIds = _.uniq(
            next.fetchEventIds.concat(r.fetchEventIds)
          );
          return false;
        }
        return true;
      });

      requests.unshift(next);
      return requests;
    });
}
