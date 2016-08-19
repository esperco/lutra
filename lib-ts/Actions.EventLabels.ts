/*
  Module for applying labels to events
*/

/// <reference path="./Queue2.ts" />
/// <reference path="./Stores.Events.ts" />

module Esper.Actions.EventLabels {

  export function add(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, {
      addLabels: [label]
    });
  }

  export function remove(events: Stores.Events.TeamEvent[], label: string) {
    apply(events, {
      removeLabels: [label],
    });
  }

  // Confirm any predicted labels
  export function confirm(events: Stores.Events.TeamEvent[],
                          fetchEvents: Stores.Events.TeamEvent[] = [])
  {
    events = _.filter(events,

      // Don't confirm inactive events
      (e) => Stores.Events.isActive(e) &&

      // Don't confirm already posted events
      e.labelScores.match({

        // None => no label or user action, so confirm empty
        none: () => true,

        /*
          Some => only confirm if score < 1 (don't need to confirm user labels)
          or if this is an unapproved hashtag. If labelScores is some([]), this
          means user has already explicitly set labels to empty and the event
          should be buffered on the backend. If none of the predictions cross
          the threshold, then labelScores should be none.
        */
        some: (labels) => _.some(labels,
          (l) => l.score < 1 || _.some(e.hashtags,
            (h) => (l.id === h.label_norm || l.id === h.hashtag_norm)
                   && !h.approved
          )
        )
      })
    );

    if (events.length > 0 || fetchEvents.length > 0) {
      apply(events, {
        fetchEvents: fetchEvents
      });
    }
  }

  // For paginated prediction, confirm and fetch new

  function apply(events: Stores.Events.TeamEvent[], opts: {
    addLabels?: string[];
    removeLabels?: string[];
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
      addLabels?: string[];
      removeLabels?: string[];
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
      newEvent.hashtags = getNewHashtags(newEvent);

      // Event labeling of any kind implies attendance
      newEvent.attendScore = 1;
      newEvent.feedback = newEvent.feedback || {
        eventid: e.id,
        teamid: e.teamId
      };
      newEvent.feedback.attended = true;

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
            var match = _.find(p.events,
              (newEvent) => newEvent.id === e.id &&
                            newEvent.calendar_id === e.calendarId);
            return match ?
              Option.some(Stores.Events.asTeamEvent(e.teamId, match)) :
              Option.none<Stores.Events.TeamEvent>();
          }));
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
      let normalized = Labels.getNorm(l);
      if (! _.find(labels, (l) => l.id === normalized)) {
        labels.push({
          id: normalized,
          displayAs: l,
          score: 1
        });
      }
    });

    _.each(opts.removeLabels, (l) => {
      let normalized = Labels.getNorm(l);
      _.remove(labels, (l) => l.id === normalized);
    });

    // Predicted labels are now confirmed
    _.each(labels, (l) => l.score = 1);

    return labels;
  }

  // Returns updated hashtags object for event
  function getNewHashtags(event: Stores.Events.TeamEvent): ApiT.HashtagState[] {
    return _.map(event.hashtags, (h) => ({
      hashtag: h.hashtag,
      hashtag_norm: h.hashtag_norm,
      label: h.label,
      label_norm: h.label_norm,
      approved: event.labelScores.match({
        none: () => false,
        some: (labels) => _.some(labels,
          (l) => h.label_norm == l.id || h.hashtag_norm == l.id
        )
      })
    }));
  }


  interface QueueRequest {
    teamId: string;
    events: Stores.Events.TeamEvent[];
    fetchEventIds: string[];
  };

  var TeamLabelQueue = new Queue2.Processor(
    // Processor
    function(r: QueueRequest) {
      return Api.batch(function() {
        var promises =
        _(r.events)
          .map((e) => e.labelScores.match({
            none: () => null,
            some: (labels) => {
              if (_.isEmpty(e.hashtags)) {
                return null;
              }
              return Api.updateHashtagStates(e.teamId,
                e.recurringEventId || e.id,
                {
                  hashtag_states: _.map(e.hashtags, (h) => ({
                    hashtag: h.hashtag,
                    approved: h.approved
                  }))
                }
              );
            }
          }))
          .compact()
          .value();

        var p = Api.setPredictLabels(r.teamId, {
          set_labels: _.map(r.events, (e) => ({
            id: e.recurringEventId || e.id,
            labels: e.labelScores.match({
              none: (): string[] => [],
              some: (scores) =>
                _(scores)
                  .filter(
                    (s) => !_.some(e.hashtags,
                      (h) => h.label_norm === s.id ||
                             h.hashtag_norm === s.id))
                  .map((s) => s.displayAs)
                  .value()
            }),
            attended: true // EventLabels change implies attended is true
          })),
          predict_labels: r.fetchEventIds
        });

        return Util.when(promises).then(() => p);
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
