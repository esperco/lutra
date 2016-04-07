/*
  Simple bindings of Components to data sources
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Containers {
  export function eventEditorModal(events: Events2.TeamEvent[], opts?: {
    minFeedback?: boolean;
  }) {
    opts = opts || { minFeedback: true };
    return ReactHelpers.contain(function() {
      // Refresh data from store before rendering modal
      var eventData = _(events)
        .map((e) => Events2.EventStore.get({
          teamId: e.teamId,
          calId: e.calendar_id,
          eventId: e.id
        }))
        .filter((e) => e.isSome())
        .map((e) => e.unwrap())
        .value();
      var teamPairs = _.map(Teams.all(),
        (t) => Option.cast(Teams.teamStore.metadata(t.teamid))
          .match<[ApiT.Team, Model.StoreMetadata]>({
            none: () => null,
            some: (m) => [t, m]
          }));

      return <Components.EventEditorModal
        eventData={eventData}
        teamPairs={teamPairs}
        minFeedback={opts.minFeedback}
      />;
    })
  }

  export function eventListModal(events: Events2.TeamEvent[]) {
    return ReactHelpers.contain(function() {
      // Refresh store data before sending to modal
      events = Option.flatten(
        _.map(events, (e) =>
          Events2.EventStore.get(Events2.storeId(e))
            .flatMap((storeData) => storeData.data)
          )
      );
      return <Components.EventListModal events={events} />
    });
  }
}
