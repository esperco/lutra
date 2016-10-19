/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings {
    pathFn = Paths.Manage.Team.pay;

    onToken(cusid: string, token: StripeTokenResponse) {
      Actions.Subscriptions.addCard(cusid, token.id).then(() =>
        Actions.Subscriptions.set(cusid, "Advanced_20160923")
      );
    }

    renderMain(team: ApiT.Team) {
      var subscription = team.team_api.team_subscription;
      var busy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });

      return <div className="panel panel-default">
        { subscription.active ?
          <div className="panel-body">
            <div className="alert alert-info">
              {team.team_name} is subscribed to
              the {Text.getPlanName(subscription.plan)}.
            </div>
            <PaymentInfo cusid={subscription.cusid}
              existingPlan={subscription.plan} busy={busy} />
          </div>
          :
          <div className="panel-body">
            { subscription.status === "Canceled" ?
              <div className="alert alert-warning">
                You have not subscribed to any plan. Please select a plan below.
              </div>
              :
              <div className="alert alert-danger">
                Your subscription has expired. Please select a plan below to renew.
              </div>
            }
            <Components.Plans cusid={subscription.cusid} />
          </div>
        }
      </div>;
    }
  }

  interface Props {
    cusid: string;
    existingPlan: ApiT.PlanId;
    busy: boolean;
  }

  export class PaymentInfo extends ReactHelpers.Component<Props, {}> {
    getCardIcon(brand: ApiT.CardBrand) {
      if (brand === "Visa")
        return "fa-cc-visa";
      if (brand === "American_express")
        return "fa-cc-amex";
      if (brand === "Mastercard")
        return "fa-cc-mastercard";
      if (brand === "Discover")
        return "fa-cc-discover";
      if (brand === "Jcb")
        return "fa-cc-jcb";
      if (brand === "Diners_club")
        return "fa-cc-diners-club";
      return "fa-credit-card-alt";
    }

    removeCard(cardid: string) {
      Actions.Subscriptions.deleteCard(this.props.cusid, cardid);
    }

    onEditCreditCard(token: StripeTokenResponse, cardid: string) {
      Actions.Subscriptions.addCard(this.props.cusid, token.id);
      Actions.Subscriptions.deleteCard(this.props.cusid, cardid);
    }

    changePlan(cusid: string, newPlan: ApiT.PlanId) {
      Actions.Subscriptions.set(cusid, newPlan);
    }

    renderCreditCard(card: ApiT.PaymentCard) {
      return <div className="list-group-item one-line" key={card.id}>
        <i className={"fa fa-fw " + this.getCardIcon(card.brand)} />
          {" "}Card ending in {card.last4}{" "}
        <span>
          <a className="pull-right text-danger" title="Remove Card"
             onClick={(e) => this.removeCard(card.id)}>
            <i className="fa fa-fw fa-times list-group-item-text" />
          </a>
          <Components.Stripe description={Text.getPlanName(this.props.existingPlan)}
            label="Submit" stripeKey={Config.STRIPE_KEY}
            onToken={(token) => this.onEditCreditCard(token, card.id)}>
            <a className="pull-right text-info" title="Edit Card">
              <i className="fa fa-fw fa-pencil list-group-item-text" />
            </a>
          </Components.Stripe>
        </span>
      </div>;
    }

    render() {
      if (this.props.busy)
        return <div className="esper-spinner"></div>;
      else {
        let details = Stores.Subscriptions.require(this.props.cusid);
        return details.cards.length ?
          <div className="esper-section">
            <Components.Plans cusid={this.props.cusid} noStripe
              onClick={(newPlan) => this.changePlan(this.props.cusid, newPlan)}
              selectedPlan={this.props.existingPlan} />
            <div className="list-group esper-section">
              { _.map(details.cards, this.renderCreditCard.bind(this)) }
            </div>
          </div>
          :
          <div className="esper-section">
            <Components.Plans cusid={this.props.cusid} />
            <div className="esper-section">
              <div className="esper-no-content">
                No credit cards found
              </div>
            </div>
          </div>;
      }
    }
  }
}
