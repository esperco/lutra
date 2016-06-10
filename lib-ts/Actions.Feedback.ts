/*
  Meeting feedback-related actions
*/

/// <reference path="./Analytics.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Stores.Events.ts" />

module Esper.Actions.Feedback {

  /*
    Post event feedback object
  */
  export function post(event: Stores.Events.TeamEvent,
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
    Stores.Events.EventStore.push(Stores.Events.storeId(newEvent), p,
      Option.some(newEvent)
    );

    return newEvent;
  }

  /*
    Post just a string action (used by e-mails)
  */
  export function postAction(event: Stores.Events.TeamEvent,
                             action: ApiT.EventFeedbackAction) {
    Analytics.track(Analytics.Trackable.SubmitFeedback, {
      teamId: event.teamId,
      action: action
    });

    var p = Api.postEventFeedbackAction(
      event.teamId, event.calendarId, event.id, action
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

    Stores.Events.EventStore.pushFetch({
      teamId: event.teamId,
      calId: event.calendarId,
      eventId: event.id
    }, p, Option.some(initNewData));

    return initNewData;
  }

  /*
    Post a string action while simultaneously fetching an event
  */
  export function postActionAndFetch({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action: ApiT.EventFeedbackAction
  }) {
    Analytics.track(Analytics.Trackable.SubmitFeedback, {
      teamId: teamId,
      action: action
    });

    var storeId = {
      teamId: teamId,
      calId: calId,
      eventId: eventId
    };
    var eventPromise = Stores.Events.EventStore.get(storeId)
      .match({
        none: () => Stores.Events.fetchOne(storeId),
        some: (e) => $.Deferred().resolve(e.data).promise()
      });
    var actionPromise = Api.postEventFeedbackAction(
      teamId, calId, eventId, action);

    eventPromise = eventPromise.then(function(optEvent) {
      return actionPromise.then((feedback) => {
        return optEvent.flatMap((e) => {
          e = _.cloneDeep(e);
          e.feedback = feedback;
          return Option.wrap(e);
        });
      });
    });
    Stores.Events.EventStore.fetch(storeId, eventPromise);

    return eventPromise;
  }
}
