/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.pay;

    renderMain(team: ApiT.Team) {
      var subscription = team.team_api.team_subscription;

      var busy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });
      if (busy) {
        return <div className="esper-spinner" />;
      }

      let details = Stores.Subscriptions.require(subscription.cusid);
      return <div className="panel panel-default"><div className="panel-body">
        { subscription.active ?
          <div className="alert alert-info">
            { Text.SubscribedToPlan(team.team_name, subscription.plan) }
          </div>
          : ( subscription.status === "Canceled" ?
          <div className="alert alert-danger">
            { Text.SubscriptionExpired }{" "}{ Text.SelectToRenew }
          </div>
          :
          <div className="alert alert-warning">
            { Text.NoPlan }{" "}{ Text.SelectToRenew }
          </div> )}
        <Components.Plans subscription={details} />
        { subscription.active ?
          <Components.CreditCardList subscription={details} /> :
          null }
      </div></div>;
    }
  }
}
