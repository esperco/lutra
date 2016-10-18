/*
  Actions for modifying subscription status
*/

/// <reference path="./Stores.Subscriptions.ts" />

module Esper.Actions.Subscriptions {

  /*
    Altering a plan requires changing team store, customer stores, etc.,
    so let's just refresh everything for now
  */

  export function set(cusId: string, planId: ApiT.PlanId) {
    Api.setSubscription(cusId, planId).then(() => location.reload(false))
  }

  export function cancel(cusId: string) {
    Api.cancelSubscription(cusId).then(() => location.reload(false));
  }


  /* Card Management */

  export function addCard(cusId: string, cardToken: string) {
    let p = Api.addNewCard(cusId, cardToken).then(
      (card) => Stores.Subscriptions.get(cusId).flatMap((sub) => {
        sub = _.cloneDeep(sub);
        sub.cards.push(card);
        sub.cards = _.uniqBy(sub.cards, (c) => c.id);
        return Option.some(sub);
      })
    );
    Stores.Subscriptions.SubscriptionStore.pushFetch(cusId, p);
  }

  export function deleteCard(cusId: string, cardId: string) {
    let p = Api.deleteCard(cusId, cardId);
    let newData = Stores.Subscriptions.get(cusId).flatMap((sub) => {
      sub = _.cloneDeep(sub);
      _.remove(sub.cards, (c) => c.id === cardId);
      return Option.some(sub);
    });
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
