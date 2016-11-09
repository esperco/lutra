/*
  Actions for modifying subscription status
*/

/// <reference path="./Save.ts" />
/// <reference path="./Stores.Subscriptions.ts" />

module Esper.Actions.Subscriptions {

  // Altering a plan requires changing team store, customer stores, etc.
  export function set({cusId, planId, redirectTarget, cardToken}: {
    cusId: string;
    planId?: ApiT.PlanId;
    cardToken?: string;
    redirectTarget?: string|Paths.Path
  }) {
    // Set plan if applicable
    let p1: JQueryPromise<void> = planId ?
      Api.setSubscription(cusId, planId) :
      $.Deferred<void>().resolve(null).promise();

    // Add card if provided
    let p2: JQueryPromise<ApiT.PaymentCard> = cardToken ?
      Api.addNewCard(cusId, cardToken) :
      $.Deferred<ApiT.PaymentCard>().resolve(null).promise();

    // Update subscription store
    let cardP = p1.then(() => p2).then((card) =>
      Stores.Subscriptions.get(cusId).map((details) => {
        details = _.cloneDeep(details);
        if (planId) {
          details.plan = planId;
        }
        if (card) {
          details.cards.push(card)
          details.cards = _.uniqBy(details.cards, (c) => c.id);
        }
        return details;
      })
    );
    Stores.Subscriptions.SubscriptionStore.pushFetch(cusId, cardP);

    // Update team stores
    let teams = Stores.Teams.all();
    _.each(teams, (team) => {
      if (team.team_api.team_subscription.cusid === cusId) {
        let newTeam = _.cloneDeep(team);
        let newSub = newTeam.team_api.team_subscription;
        newSub.status = (
          newSub.status === "Trialing" || !!newSub.status
        ) ? "Trialing" : "Active";
        newSub.active = true;
        newSub.plan = planId;
        Stores.Teams.TeamStore.push(newTeam.teamid, p1, Option.some(newTeam));
      }
    });

    // Update customer store
    let newCustOpt = Stores.Customers.get(cusId).map((cust) => {
      let newCust = _.cloneDeep(cust);
      let newSub = newCust.subscription;
      newSub.status = (
        newSub.status === "Trialing" || !!newSub.status
      ) ? "Trialing" : "Active";
      newSub.active = true;
      newSub.plan = planId;
      return newCust;
    });
    Stores.Customers.CustomerStore.push(cusId, p1, newCustOpt);

    Analytics.track(Analytics.Trackable.SelectPlan, { cusId, planId });
    if (redirectTarget) {
      cardP.done(() => Route.nav.go(redirectTarget));
    }

    // Return and track card promise since it joins p1 and p2
    Save.monitorStr(cardP, "setSubscription");
    return cardP;
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
    return set({cusId, cardToken}).then(() => null);
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
