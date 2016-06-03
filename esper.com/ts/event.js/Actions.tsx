/*
  Actions for single event page
*/

module Esper.Actions {

  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action?: ApiT.EventFeedbackAction;
  }) {
    var storeId = {
      teamId: teamId,
      calId: calId,
      eventId: eventId
    };
    Stores.Events.fetchOne(storeId)
      .then((optEvent: Option.T<Stores.Events.TeamEvent>) => {
        optEvent.match({
          none: () => Route.nav.home(),
          some: (event) => {
            if (action) {
              Feedback.postAction(event, action);
            }
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
