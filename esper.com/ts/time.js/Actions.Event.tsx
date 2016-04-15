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
          Analytics.track(Analytics.Trackable.SubmitFeedback, {
            teamId: teamId,
            action: action
          });
          var p = Api.postEventFeedbackAction(teamId, calId, eventId, action)
            .then((feedback: ApiT.EventFeedback) => {
              var newEvent = _.cloneDeep(event);
              newEvent.feedback = feedback;
              return Option.some(newEvent);
            });
          var initNewData = _.cloneDeep(event);
          switch ((action || "").toLowerCase()) {
            case "good":
              initNewData.feedback.attended = true;
              initNewData.feedback.rating = 5;
              break;
            case "bad":
              initNewData.feedback.attended = true;
              initNewData.feedback.rating = 5;
              break;
            case "didnt_attend":
              initNewData.feedback.attended = false;
              break;
            default:
              break;
          }
          Events2.EventStore.pushFetch(storeId, p, Option.some(initNewData));
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
