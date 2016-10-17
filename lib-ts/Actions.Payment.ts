/*
  Module for actions that alter or create payment infos
*/

module Esper.Actions.Payment {
  export function addNewCard(cusid: string, cardToken: string) {
    Api.addNewCard(cusid, cardToken);
  }

  export function subscribe(cusid: string, planid: ApiT.PlanId) {
    Api.setSubscription(cusid, planid);
  }
}
