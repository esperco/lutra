/// <reference path="./Views.Event.tsx" />
/// <refernece path="./Actions" />

module Esper.Actions {

  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action: string;
  }) {
    var storeId = {
      teamId: teamId,
      calId: calId,
      eventId: eventId
    };
    Events2.fetchOne(storeId).then((optEvent: Option.T<Events2.TeamEvent>) => {
      optEvent.match({
        none: () => Route.nav.home(),
        some: (event) => {
          var p = Api.postEventFeedbackAction(teamId, eventId, action)
            .then((feedback: ApiT.EventFeedback) => {
              var newEvent = _.cloneDeep(event);
              newEvent.feedback = feedback;
              return Option.some(newEvent);
            });
          Events2.EventStore.pushFetch(storeId, p);
        }
      })
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
