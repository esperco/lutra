/// <reference path="./Views.Event.tsx" />
/// <refernece path="./Actions" />

module Esper.Actions {

  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action: ApiT.EventFeedbackAction;
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
          Feedback.postAction(event, action);
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
