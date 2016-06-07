/*
  Simple bindings of Components to data sources
*/

module Esper.Containers {
  export function eventEditorModal(events: Stores.Events.TeamEvent[], opts?: {
    minFeedback?: boolean;
    onDone?: () => void;
  }) {
    opts = opts || { minFeedback: true };
    return ReactHelpers.contain(function() {
      // Refresh data from store before rendering modal
      var eventData = _(events)
        .map((e) => Stores.Events.EventStore.get({
          teamId: e.teamId,
          calId: e.calendarId,
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

  export function eventListModal(events: Stores.Events.TeamEvent[]) {
    return ReactHelpers.contain(function() {
      // Refresh store data before sending to modal
      events = Option.flatten(
        _.map(events, (e) =>
          Stores.Events.EventStore.get(Stores.Events.storeId(e))
            .flatMap((storeData) => storeData.data)
          )
      );

      // Get the team(s) for events
      var teams = Stores.Events.getTeams(events);

      // Set up actions so that hitting "done" goes back to the list
      var backFn = () => Layout.renderModal(eventListModal(events));
      var labelFn = (event: Stores.Events.TeamEvent) => {

        // Confirm before opening modal
        Actions.EventLabels.confirm([event]);

        Layout.renderModal(
          eventEditorModal([event], {
            minFeedback: true,
            onDone: backFn
          })
        );
      };
      var feedbackFn = (event: Stores.Events.TeamEvent) =>
        Layout.renderModal(
          eventEditorModal([event], {
            minFeedback: false,
            onDone: backFn
          })
        );

      return <Components.FilteredEventListModal
        events={events} teams={teams}
        onEventClick={labelFn}
        onAddLabelClick={labelFn}
        onFeedbackClick={feedbackFn}
      />;
    });
  }

  export function confirmListModal(events: Stores.Events.TeamEvent[],
                                   initPageStart=0) {
    return ReactHelpers.contain(function() {
      // Refresh store data before sending to modal, get opts
      var fetching = false;
      var hasError = false;
      events = Option.flatten(
        _.map(events, (e) =>
          Stores.Events.EventStore.get(Stores.Events.storeId(e))
            .flatMap((storeData) => {
              if (storeData.dataStatus === Model2.DataStatus.FETCHING) {
                fetching = true;
              } else if (
                  storeData.dataStatus === Model2.DataStatus.FETCH_ERROR ||
                  storeData.dataStatus === Model2.DataStatus.PUSH_ERROR)
              {
                hasError = true;
              }
              return storeData.data;
            })
          )
      );

      // Get the team(s) for events
      var teams = Stores.Events.getTeams(events);

      // Hold reference to previous modal so we can capture current page
      var listRef: Components.ConfirmListModal;

      /*
        Set up actions so that hitting "done" goes back to confirmation
        and preserves current page number
      */
      var backFn = () => {
        var backPageStart = listRef ? listRef.state.pageIndices[0] : 0;
        Layout.renderModal(confirmListModal(events, backPageStart));
      };
      var labelFn = (event: Stores.Events.TeamEvent) => {

        // Confirm before opening modal
        Actions.EventLabels.confirm([event]);

        Layout.renderModal(
          eventEditorModal([event], {
            minFeedback: true,
            onDone: backFn
          })
        );
      };

      return <Components.ConfirmListModal
        ref={(c) => listRef = c}
        initPageStart={initPageStart}
        busy={fetching}
        error={hasError}
        events={events}
        teams={teams}
        onEventClick={labelFn}
        onAddLabelClick={labelFn}
      />;
    });
  }
}
