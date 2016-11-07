/*
  Actions for modifying subscription status
*/

/// <reference path="./Save.ts" />
/// <reference path="./Stores.Subscriptions.ts" />

module Esper.Actions.Subscriptions {

  /*
    Altering a plan requires changing team store, customer stores, etc.,
    so let's just refresh everything for now
  */

  export function set({cusId, planId, redirectTarget, cardToken}: {
    cusId: string;
    planId: ApiT.PlanId;
    cardToken?: string;
    redirectTarget?: string|Paths.Path
  }) {
    // Add card first if provided
    let p1 = cardToken ?
      addCard(cusId, cardToken) :
      $.Deferred().resolve().promise();

    let p2 = p1.then(() => Api.setSubscription(cusId, planId)).then(
      () => {
        if (_.isEmpty(redirectTarget))
          location.reload(false);
        else
          Route.nav.go(redirectTarget);
      });

    Analytics.track(Analytics.Trackable.SelectPlan, { cusId, planId });
    Save.monitorStr(p2, "setSubscription");
    return p2;
  }

  export function cancel(cusId: string) {
    let p = Api.cancelSubscription(cusId).then(
      () => location.reload(false));
    Save.monitorStr(p, "cancelSubscription");
    return p;
  }


  /* Card Management */

  export function addCard(cusId: string, cardToken: string) {
    // Run in parallel with actual actions. Send email only if card.
    Api.sendSupportEmail(`${Login.myEmail()} has added a credit card`);
    Analytics.track(Analytics.Trackable.AddCard, { cusId });

    let p = Api.addNewCard(cusId, cardToken).then(
      (card) => Stores.Subscriptions.get(cusId).flatMap((sub) => {
        sub = _.cloneDeep(sub);
        sub.cards.push(card);
        sub.cards = _.uniqBy(sub.cards, (c) => c.id);
        return Option.some(sub);
      })
    );
    Stores.Subscriptions.SubscriptionStore.pushFetch(cusId, p);
    return p.then(() => null);
  }

  export function deleteCard(cusId: string, cardId: string) {
    let p = Api.deleteCard(cusId, cardId);
    let newData = Stores.Subscriptions.get(cusId).flatMap((sub) => {
      sub = _.cloneDeep(sub);
      _.remove(sub.cards, (c) => c.id === cardId);
      return Option.some(sub);
    });

    Analytics.track(Analytics.Trackable.DeleteCard, { cusId });
    Stores.Subscriptions.SubscriptionStore.push(cusId, p, newData);
  }

  export function setDefaultCard(cusId: string, cardId: string) {
    let p = Api.setDefaultCard(cusId, cardId);
    let newData = Stores.Subscriptions.get(cusId).flatMap((sub) => {
      sub = _.cloneDeep(sub);
      let matches = _.remove(sub.cards, (c) => c.id === cardId);
      if (! _.isEmpty(matches)) {
        let card = matches[0];
        sub.cards.unshift(card);
      }
      return Option.some(sub);
    });
    Stores.Subscriptions.SubscriptionStore.push(cusId, p, newData);
  }

}
