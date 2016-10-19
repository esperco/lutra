/*
  Component for displaying plan information
 */

module Esper.Components {
  interface Props {
    cusid: string;
    noStripe?: boolean;
    selectedPlan?: ApiT.PlanId;
    onClick?: (selectedPlan: ApiT.PlanId) => any;
  }

  export class Plans extends ReactHelpers.Component<Props, {}> {
    onToken(token: StripeTokenResponse, planid: ApiT.PlanId) {
      Actions.Subscriptions.addCard(this.props.cusid, token.id).then(() =>
        Actions.Subscriptions.set(this.props.cusid, planid).then(() =>
          Api.sendSupportEmail(`${Login.myEmail()} has just signed up ` +
            `for ${Text.getPlanName(planid)}`)
          )
      );
    }

    render() {
      return this.props.noStripe ?
        <div className="esper-flex-list esper-section">
          <div className="esper-section">
            <PlanInfo planid="Basic_20160923" onClick={this.props.onClick}
              selectedPlan={this.props.selectedPlan} />
          </div>
          <div className="esper-section">
            <PlanInfo planid="Advanced_20160923" onClick={this.props.onClick}
              selectedPlan={this.props.selectedPlan} />
          </div>
        </div>
        :
        <div className="esper-flex-list esper-section">
          <div className="esper-section">
            <Components.Stripe stripeKey={Config.STRIPE_KEY}
              description="Basic Plan" label="Submit"
              onToken={(token) => this.onToken(token, "Basic_20160923")}>
              <PlanInfo planid="Basic_20160923"
                selectedPlan={this.props.selectedPlan} />
            </Components.Stripe>
          </div>
          <div className="esper-section">
            <Components.Stripe stripeKey={Config.STRIPE_KEY}
              description="Executive Plan" label="Submit"
              onToken={(token) => this.onToken(token, "Advanced_20160923")}>
              <PlanInfo planid="Advanced_20160923"
                selectedPlan={this.props.selectedPlan} />
            </Components.Stripe>
          </div>
        </div>;
    }
  }

  class PlanInfo extends ReactHelpers.Component<{
    planid: ApiT.PlanId;
    selectedPlan?: ApiT.PlanId;
    onClick?: (selectedPlan: ApiT.PlanId) => any;
  }, {}> {
    render() {
      var planInfo: JSX.Element;
      var pricing: string;
      if (this.props.planid === "Basic_20160923") {
        planInfo = <ul>
          { _.map(Text.BasicPlanFeatures, (feature, i) =>
              <li key={this.getId(`basic-feat-${i}`)}>{feature}</li>)}
        </ul>;
        pricing = Text.BasicPlanPrice;
      }
      else if (this.props.planid === "Advanced_20160923") {
        planInfo = <ul>
          { _.map(Text.AdvancedPlanFeatures, (feature, i) =>
              <li key={this.getId(`advanced-feat-${i}`)}>{feature}</li>)}
        </ul>;
        pricing = Text.AdvancedPlanPrice;
      }

      let selected = this.props.selectedPlan === this.props.planid;

      return <div className={classNames("sub-plan-box", {
        selected
      })} onClick={
        (e) => this.props.onClick ? this.props.onClick(this.props.planid)
                                  : null
      }>
        <h4 className="sub-plan-heading">
          { Text.getPlanName(this.props.planid) }
        </h4>
        <div className="sub-plan-body">
          <div className="free-trial">{Text.FreeTrialMsg}</div>
          <div className="pricing">{ pricing }</div>
          { planInfo }
        </div>
        <div className="sub-plan-footer">
          <button className="btn btn-success form-control" disabled={selected}>
            { selected ? Text.ActivePlan :
            ( this.props.selectedPlan ? Text.SelectPlan : Text.StartPlan )}
          </button>
        </div>
      </div>;
    }
  }
}
