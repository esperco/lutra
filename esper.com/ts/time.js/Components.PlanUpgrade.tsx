/*
  A modal to inform the user to upgrade their plan.
*/

module Esper.Components {
  interface Props {
    subscription?: ApiT.SubscriptionDetails;
  }

  export class PlanUpgradeModal extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Modal title="Upgrade Your Plan" icon="fa-arrow-up">
        <div className="esper-section">
          <div className="alert alert-warning">
            { Text.PlanUpgradeText }
          </div>
          { !this.props.subscription ?
            <div className="esper-spinner" /> :
            <Plans
              subscription={this.props.subscription}
              plans={[Text.BasicPlan, Text.ExecPlan]}
              onSelect={(plan) => this.onSelect(plan)}
            />
          }
        </div>
      </Modal>;
    }

    // Callback for selection, returns promise since we may need to wait on
    // Stripe
    onSelect(plan: Types.PlanDetails) {
      if (! this.props.subscription)
        return $.Deferred().resolve().reject(); // Sanity check

      // Check if we need to ask for stripe CC
      let needStripe = _.isEmpty(this.props.subscription.cards);
      if (needStripe) {
        let dfd = $.Deferred<void>();
        Esper.Stripe.getHandler().then((handler) => handler.open({
          label: "Submit",
          description: plan.name,
          token: (token) => Actions.Subscriptions.set({
            cusId: this.props.subscription.cusid,
            planId: plan.id,
            cardToken: token.id
          }).then(() => dfd.resolve()),
          closed: () => { dfd.state() === "pending" ? dfd.reject() : null }
        }));
        return dfd.promise();
      }

      // Else, just change plan
      return Actions.Subscriptions.set({
        cusId: this.props.subscription.cusid,
        planId: plan.id
      }).then(() => null);
    }
  }
}
