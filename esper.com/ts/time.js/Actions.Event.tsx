/// <reference path="./Views.Event.tsx" />
/// <refernece path="./Actions" />

module Esper.Actions {

  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action: string;
  }) {
    Events.fetch1(teamId, calId, eventId).then((event: Events.TeamEvent) => {
      var storeId = Events.keyForEvent(teamId, calId, eventId);
      var p = Api.postEventFeedbackAction(teamId, eventId, action)
        .then((feedback: ApiT.EventFeedback) => {
          var newEvent = _.cloneDeep(event);
          newEvent.feedback = feedback;
          return newEvent;
        });
      Events.EventStore.pushFetch(storeId, p);
    });

    render(<Views.EventView
      teamId={teamId}
      calId={calId}
      eventId={eventId}
      initAction={!!action}
    />);
    Analytics.page(Analytics.Page.EventFeedback, {
      teamId: teamId,
      calId: calId,
      eventId: eventId,
      action: action
    });
  }
}
