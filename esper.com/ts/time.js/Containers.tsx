/*
  Simple bindings of Components to data sources
*/

/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Containers {
  export function eventEditorModal(events: Events2.TeamEvent[], opts?: {
    minFeedback?: boolean;
    onDone?: () => void;
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

      return <Components.EventEditorModal
        eventData={eventData}
        teams={Stores.Teams.all()}
        focusOnLabels={opts.minFeedback}
        minFeedback={opts.minFeedback}
        onDone={opts.onDone}
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

      // Get the team(s) for events
      var teams = Events2.getTeams(events);

      // Set up actions so that hitting "done" goes back to the list
      var backFn = () => Layout.renderModal(eventListModal(events));
      var labelFn = (event: Events2.TeamEvent) =>
        Layout.renderModal(
          eventEditorModal([event], {
            minFeedback: true,
            onDone: backFn
          })
        );
      var feedbackFn = (event: Events2.TeamEvent) =>
        Layout.renderModal(
          eventEditorModal([event], {
            minFeedback: false,
            onDone: backFn
          })
        );

      return <Components.EventListModal
        events={events} teams={teams}
        onEventClick={labelFn}
        onAddLabelClick={labelFn}
        onFeedbackClick={feedbackFn}
      />;
    });
  }
}
