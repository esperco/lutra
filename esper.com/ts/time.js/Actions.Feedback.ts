module Esper.Actions.Feedback {

  /*
    Post event feedback object
  */
  export function post(event: Events2.TeamEvent,
                       feedback: ApiT.EventFeedback) {
    var newEvent = _.cloneDeep(event);
    newEvent.feedback = feedback;

    Analytics.track(Analytics.Trackable.SubmitFeedback, {
      teamId: newEvent.teamId,
      hasRating: !!feedback.rating,
      hasAttended: !_.isUndefined(feedback.attended),
      hasNotes: !!feedback.notes
    });

    var p = Api.postEventFeedback(
      newEvent.teamId, newEvent.id, newEvent.feedback
    );
    Events2.EventStore.push(Events2.storeId(newEvent), p,
      Option.some(newEvent)
    );

    return newEvent;
  }

  /*
    Post just a string action (used by e-mails)
  */
  export function postAction(event: Events2.TeamEvent,
                             action: ApiT.EventFeedbackAction) {
    Analytics.track(Analytics.Trackable.SubmitFeedback, {
      teamId: event.teamId,
      action: action
    });

    var p = Api.postEventFeedbackAction(
      event.teamId, event.calendar_id, event.id, action
    ).then((feedback: ApiT.EventFeedback) => {
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
        initNewData.feedback.rating = 1;
        break;
      case "didnt_attend":
        initNewData.feedback.attended = false;
        break;
      default:
        break;
    }

    Events2.EventStore.pushFetch({
      teamId: event.teamId,
      calId: event.calendar_id,
      eventId: event.id
    }, p, Option.some(initNewData));

    return initNewData;
  }
}
