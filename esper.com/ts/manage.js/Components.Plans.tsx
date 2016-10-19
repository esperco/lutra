/*
  Component for displaying plan information
 */

module Esper.Components {
  interface Props {
    cusid: string;
    isDisplay?: boolean;
    selectedPlan?: ApiT.PlanId;
    onClick?: (selectedPlan: ApiT.PlanId) => any;
  }

  export class Plans extends ReactHelpers.Component<Props, {}> {
    onToken(token: StripeTokenResponse, planid: ApiT.PlanId) {
      Actions.Subscriptions.addCard(this.props.cusid, token.id).then(() =>
        Actions.Subscriptions.set(this.props.cusid, planid)
      );
    }

    render() {
      return this.props.isDisplay ? <div className="esper-flex-list">
        <PlanInfo planid="Basic_20160923" onClick={this.props.onClick}
          selectedPlan={this.props.selectedPlan} />
        <PlanInfo planid="Advanced_20160923" onClick={this.props.onClick}
          selectedPlan={this.props.selectedPlan} />
      </div>
      :
      <div className="esper-flex-list">
        <Components.Stripe stripeKey={Config.STRIPE_KEY}
          description="Basic Plan" label="Submit"
          onToken={(token) => this.onToken(token, "Basic_20160923")}>
          <PlanInfo planid="Basic_20160923"
            selectedPlan={this.props.selectedPlan} />
        </Components.Stripe>
        <Components.Stripe stripeKey={Config.STRIPE_KEY}
          description="Executive Plan" label="Submit"
          onToken={(token) => this.onToken(token, "Advanced_20160923")}>
          <PlanInfo planid="Advanced_20160923"
            selectedPlan={this.props.selectedPlan} />
        </Components.Stripe>
      </div>;
    }
  }

  class PlanInfo extends ReactHelpers.Component<{
    planid: ApiT.PlanId;
    selectedPlan?: ApiT.PlanId;
    onClick?: (selectedPlan: ApiT.PlanId) => any;
  }, {}> {
    basicPlanInfo() {
      return <ul>
        { _.map(Text.BasicPlanFeatures, (feature, i) =>
            <li key={this.getId(`basic-feat-${i}`)}>{feature}</li>)}
      </ul>;
    }

    advancedPlanInfo() {
      return <ul>
        { _.map(Text.AdvancedPlanFeatures, (feature, i) =>
            <li key={this.getId(`advanced-feat-${i}`)}>{feature}</li>)}
      </ul>;
    }

    render() {
      var planInfo: JSX.Element;
      if (this.props.planid === "Basic_20160923")
        planInfo = this.basicPlanInfo();
      if (this.props.planid === "Advanced_20160923")
        planInfo = this.advancedPlanInfo();

      return <div className={classNames("sub-plan-box", {
        selected: this.props.selectedPlan === this.props.planid
      })} onClick={
        (e) => this.props.onClick ? this.props.onClick(this.props.planid)
                                  : null
      }>
        <div className="sub-plan-heading">
          { Text.getPlanName(this.props.planid) }
        </div>
        { planInfo }
      </div>;
    }
  }
}