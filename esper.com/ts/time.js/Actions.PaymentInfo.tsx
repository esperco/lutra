/*
  Actions for payments info page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  export function renderPaymentInfo({teamId}: {
    teamId: string;
  }) {
    if (Login.data.is_sandbox_user) {
      Route.nav.home();
      return;
    }

    let team = Stores.Teams.require(teamId);
    Stores.Subscriptions.fetch(team.team_api.team_subscription.cusid);
    Stores.Customers.refresh();
    render(<Views.PaymentInfo teamId={teamId} />);

    Analytics.page(Analytics.Page.PaymentInfo, { teamId });
  }
}
