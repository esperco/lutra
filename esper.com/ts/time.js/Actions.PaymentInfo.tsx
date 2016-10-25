/*
  Actions for payments info page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  export function renderPaymentInfo({teamId}: {
    teamId: string;
  }) {
    let team = Stores.Teams.require(teamId);
    Stores.Subscriptions.fetch(team.team_api.team_subscription.cusid);
    Stores.Customers.refresh();
    render(<Views.PaymentInfo teamId={teamId} />);
  }
}
