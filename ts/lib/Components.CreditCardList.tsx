/*
  List credit cards for a customer, allow editing + removal
*/

module Esper.Components {
  interface Props {
    subscription: ApiT.SubscriptionDetails;
  }

  export class CreditCardList extends ReactHelpers.Component<Props, {}> {
    componentDidMount() {
      let sub = this.props.subscription;
      if (_.isEmpty(sub.cards) && sub.plan) {
        Esper.Stripe.getHandler().then((handler) => handler.open({
          name: 'Esper',
          description: Text.getPlanName(sub.plan),
          panelLabel: "Submit",
          token: (token) => this.addCard(token)
        }));
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

    addCard(token: StripeTokenResponse) {
      Actions.Subscriptions.addCard(this.props.subscription.cusid, token.id);
    }

    removeCard(cardid: string) {
      Actions.Subscriptions.deleteCard(this.props.subscription.cusid, cardid);
    }

    editCreditCard(token: StripeTokenResponse, cardid: string) {
      Actions.Subscriptions.addCard(this.props.subscription.cusid, token.id);
      Actions.Subscriptions.deleteCard(this.props.subscription.cusid, cardid);
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
          <Components.Stripe
            description={Text.getPlanName(this.props.subscription.plan)}
            label="Submit" stripeKey={Config.STRIPE_KEY}
            onToken={(token) => this.editCreditCard(token, card.id)}>
            <a className="pull-right text-info" title="Edit Card">
              <i className="fa fa-fw fa-pencil list-group-item-text" />
            </a>
          </Components.Stripe>
        </span>
      </div>;
    }

    render() {
      let cards = this.props.subscription.cards;
      if (_.isEmpty(cards)) {
        return <div className="esper-section">
          <Components.Stripe
            description={Text.getPlanName(this.props.subscription.plan)}
            label="Submit" stripeKey={Config.STRIPE_KEY}
            onToken={(token) => this.addCard(token)}>
            <button className="btn btn-default form-control">
              <i className="fa fa-fw fa-left fa-plus-circle" />
              { Text.AddCard }
            </button>
          </Components.Stripe>
        </div>;
      }

      return <div className="list-group esper-section">
        { _.map(cards, (c) => this.renderCreditCard(c)) }
      </div>;
    }
  }
}
