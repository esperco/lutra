/*
  Actions for payments info page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  export function renderPaymentInfo({teamId}: {
    teamId: string;
  }) {
    let team = Stores.Teams.require(teamId);
    render(<Views.PaymentInfo
      subscription={team.team_api.team_subscription} />);
  }
}
