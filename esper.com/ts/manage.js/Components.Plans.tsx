/*
  Component for displaying plan information
 */

module Esper.Components {
  interface Props {
    cusid: string;
  }

  export class Plans extends ReactHelpers.Component<Props, {}> {
    onToken(token: StripeTokenResponse, planid: ApiT.PlanId) {
      Actions.Subscriptions.addCard(this.props.cusid, token.id).then(() =>
        Actions.Subscriptions.set(this.props.cusid, planid)
      );
    }

    render() {
      return <div className="esper-flex-list">
        <Components.Stripe stripeKey={Config.STRIPE_KEY}
          description="Basic Plan" label="Submit"
          onToken={(token) => this.onToken(token, "Basic_20160923")}>
          <div className="sub-plan-box">
            <div className="sub-plan-heading">
              { Text.getPlanName("Basic_20160923") }
            </div>
            <ul>
              <li>Share up to 2 calendars</li>
              <li>Browse up to 2 months of calendar history</li>
              <li>Use #hashtags to label your events</li>
              <li>Receive weekly label reminder emails</li>
            </ul>
          </div>
        </Components.Stripe>
        <Components.Stripe stripeKey={Config.STRIPE_KEY}
          description="Executive Plan" label="Submit"
          onToken={(token) => this.onToken(token, "Advanced_20160923")}>
          <div className="sub-plan-box">
            <div className="sub-plan-heading">
              { Text.getPlanName("Advanced_20160923") }
            </div>
            <ul>
              <li>Unlimited shared calendars</li>
              <li>Browse up to 5 YEARS of calendar history</li>
              <li>Use #hashtags to label your events</li>
              <li>Receive weekly label reminder emails</li>
              <li>Customizable report page</li>
              <li>Advanced events filtering</li>
              <li>Time Series feature</li>
            </ul>
          </div>
        </Components.Stripe>
      </div>;
    }
  }
}