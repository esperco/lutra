/*
  Modal for entering credit card information
*/

module Esper.Components {
  interface Props {
    error?: boolean;
    subscription: ApiT.TeamSubscription;
  }

  export class PaymentModal extends ReactHelpers.Component<Props, {}> {
    getPlan() {
      if (this.props.subscription.plan === "Basic_20160923") {
        return "Basic Plan";
      } else if (this.props.subscription.plan === "Advanced_20160923") {
        return "Executive Plan";
      } else {
        return "Enterprise Plan";
      }
    }

    getPrice() {
      if (this.props.subscription.plan === "Basic_20160923") {
        return 15000;
      } else if (this.props.subscription.plan === "Advanced_20160923") {
        return 23000;
      } else {
        // FIXME: This isn't correct, an enterprise plan does not have a team.
        let team = Stores.Teams.require(this.props.subscription.teamid);
        return 200 * team.team_assistants.length;
      }
    }

    onToken(token: StripeTokenResponse) {
      Actions.Payment.addNewCard(this.props.subscription.cusid, token.id);
      Layout.closeModal();
    }

    render() {
      return <ModalBase>
        <ModalHeader icon="fa-credit-card" title="Payment" />
        <div className="modal-body">
          <div className="esper-section">
            <div className="alert alert-info">
              { Text.PaymentDescription }
            </div>
            { this.props.error ? <ErrorMsg /> : null }
          </div>
          <div className="esper-section">
            <div>
              Your selected plan is: {this.getPlan()}
            </div>
            <Components.Stripe
              amount={this.getPrice()} description={this.getPlan()}
              onToken={this.onToken}
              stripeKey={function() {
                if (Esper.PRODUCTION)
                  return Config.STRIPE_KEY_PROD;
                return Config.STRIPE_KEY_DEV;
              }()}
            />
          </div>
        </div>
      </ModalBase>;
    }
  }
}
