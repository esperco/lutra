/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings {
    pathFn = Paths.Manage.Team.pay;

    getPlan() {
      return "Executive Plan"; // TODO - Add other plans
    }

    onToken(cusid: string, token: StripeTokenResponse) {
      Actions.Payment.acceptPaymentInformation(cusid, token.id).then(() =>
        location.reload()
      );
    }

    renderMain(team: ApiT.Team) {
      var subscription = team.team_api.team_subscription;
      return <div className="panel panel-default">
        { subscription.active ?
          <div className="panel-body">
            <div className="alert alert-info">
              You are subscribed to the {Text.getPlanName(subscription.plan)}.
            </div>
          </div>
          :
          <div className="panel-body">
            { subscription.status !== "Past_due" &&
              subscription.status !== "Unpaid" ?
              <div className="alert alert-warning">
                You have not subscribed to any plan.
              </div>
              :
              <div className="alert alert-danger">
                Your subscription has expired.
              </div>
            }
            <Components.Stripe label={"Submit"}
              description={this.getPlan()}
              onToken={(token) => this.onToken(subscription.cusid, token)} />
          </div>
        }
      </div>;
    }
  }
}
