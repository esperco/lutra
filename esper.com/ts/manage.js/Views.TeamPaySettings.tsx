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
      Actions.Subscriptions.addCard(cusid, token.id);
      Actions.Subscriptions.set(cusid, "Advanced_20160923");
    }

    renderMain(team: ApiT.Team) {
      var subscription = team.team_api.team_subscription;

      Stores.Subscriptions.fetch(subscription.cusid);

      var busy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });

      return <div className="panel panel-default">
        { subscription.active ?
          <div className="panel-body">
            <div className="alert alert-info">
              {team.team_name} is subscribed to the {Text.getPlanName(subscription.plan)}.
            </div>
            <CreditCardList cusid={team.team_api.team_subscription.cusid}
              busy={busy} />
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

  interface Props {
    cusid: string;
    busy: boolean;
  }

  interface State {
    rmCard?: string;
  }

  export class CreditCardList extends ReactHelpers.Component<Props, State> {
    _handler: StripeCheckoutHandler;

    constructor(props: Props) {
      super(props);
      this.initStripe();
    }

    initStripe() {
      // From https://stripe.com/docs/checkout#integration-custom
      this._handler = StripeCheckout.configure({
        key: Config.STRIPE_KEY,
        email: Login.myEmail(),

        // Esper logo
        image: 'https://s3.amazonaws.com/stripe-uploads/' +
               'acct_14skFFJUNehGQrIumerchant-icon-' +
               '1425935548640-Logo_symbol.png',

        locale: 'auto',
        token: this.onToken.bind(this)
      });
    }

    onToken(token: StripeTokenResponse) {
      Actions.Subscriptions.addCard(this.props.cusid, token.id);
      Actions.Subscriptions.deleteCard(this.props.cusid, this.state.rmCard);
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this._handler) {
        this._handler.close();
      }
    }

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

    editCard(cardid: string) {
      this.mutateState((s) => s.rmCard = cardid);
      this._handler.open({
        name: 'Esper',
        description: "Executive Plan",
        billingAddress: true,
        zipCode: true,
        panelLabel: "Submit"
      });
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
          <a className="pull-right text-info" title="Edit Card"
             onClick={(e) => this.editCard(card.id)}>
            <i className="fa fa-fw fa-pencil list-group-item-text" />
          </a>
        </span>
      </div>;
    }

    render() {
      if (this.props.busy)
        return <div className="esper-spinner"></div>;
      else {
        let details = Stores.Subscriptions.require(this.props.cusid);
        return details.cards.length ?
          <div className="list-group">
            { _.map(details.cards, this.renderCreditCard.bind(this)) }
          </div>
          :
          <div>
            <div className="esper-no-content">
              No credit cards found
            </div>
            <Components.Stripe description="Executive Plan"
              label="Submit"
              onToken={(token) => Actions.Subscriptions.addCard(this.props.cusid, token.id)} />
          </div>;
      }
    }
  }
}
