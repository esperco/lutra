/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.pay;

    renderMain(team: ApiT.Team) {
      let subscription = team.team_api.team_subscription;
      let subBusy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });
      let custBusy = !Stores.Customers.ready();
      if (subBusy || custBusy) {
        return <div className="esper-spinner" />;
      }

      let details = Stores.Subscriptions.get(subscription.cusid)
        .unwrapOr(null);

      return <Components.PaymentInfo
        team={team}
        customers={Stores.Customers.all()}
        details={details}
      />;
    }
  }
}
