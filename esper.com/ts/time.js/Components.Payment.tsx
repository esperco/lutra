/*
  Modal for entering credit card information
*/

module Esper.Components {
  interface Props {
    error?: boolean;
    subscription: ApiT.TeamSubscription;
  }

  export class PaymentModal extends ReactHelpers.Component<Props, {}> {
    onToken(token: StripeTokenResponse) {
      Actions.Payment.addNewCard(this.props.subscription.cusid, token.id);
      Actions.Payment.subscribe(this.props.subscription.cusid, "Advanced_20160923");
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
            <Components.Stripe
              label={"Submit"}
              description={"Executive Plan"}
              onToken={this.onToken.bind(this)}
              stripeKey={Config.STRIPE_KEY}
            />
          </div>
        </div>
      </ModalBase>;
    }
  }
}
