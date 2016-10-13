/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings {
    pathFn = Paths.Manage.Team.pay;

    // TODO
    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          Hello world.

          <Components.Stripe
            stripeKey={Config.STRIPE_KEY}
            amount={9900} description="Pro Plan"
            onToken={(token) => {
              // TODO: Should pass token.id to server
              console.info(token.id);

              // Or do something with the error
              if (token.error) { console.error(token.error); }
            }}
          />
        </div>
      </div>;
    }
  }
}
