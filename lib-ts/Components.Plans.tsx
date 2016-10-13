/*
  Component for displaying plan information
 */

module Esper.Components {
  interface Props {
    subscription: ApiT.SubscriptionDetails|ApiT.TeamSubscription;
  }

  export class Plans extends ReactHelpers.Component<Props, {}> {
    render() {
      let subscription = this.props.subscription;
      return <div className="esper-flex-list esper-section">
        <div className="esper-section">
          <PlanInfo planid="Basic_20161019" subscription={subscription} />
        </div>
        <div className="esper-section">
          <PlanInfo planid="Executive_20161019" subscription={subscription} />
        </div>
      </div>;
    }
  }


  interface PlanInfoProps {
    subscription: ApiT.SubscriptionDetails|ApiT.TeamSubscription;
    planid: ApiT.PlanId;
  }

  class PlanInfo extends ReactHelpers.Component<PlanInfoProps, {
    busy: boolean;
  }> {
    constructor(props: PlanInfoProps) {
      super(props);
      this.state = { busy: false };
    }

    onToken(token: StripeTokenResponse) {
      this.setState({ busy: true });

      let cusId = this.props.subscription.cusid;
      let planId = this.props.planid;

      // Run in parallel with actual actions
      Api.sendSupportEmail(`${Login.myEmail()} has just signed up ` +
        `for ${Text.getPlanName(planId)}`);

      Actions.Subscriptions.addCard(cusId, token.id).then(() =>
        Actions.Subscriptions.set(cusId, planId)
      ).always(() => this.setState({ busy: false }));
    }

    changePlan() {
      this.setState({ busy: true });

      Actions.Subscriptions.set(
        this.props.subscription.cusid,
        this.props.planid
      ).always(() => this.setState({ busy: false }));
    }

    render() {
      let description = (() => {
        switch (this.props.planid) {
          case "Basic_20161019":
            return "Basic Plan";
          case "Executive_20161019":
            return "Executive Plan";
          case "Enterprise_20160923":
            return "Enterprise Plan";
          default:
            return "Esper";
        }
      })();

      if (_.isEmpty((this.props.subscription as ApiT.SubscriptionDetails).cards)) {
        return <Components.Stripe stripeKey={Config.STRIPE_KEY}
          description={description} label="Submit"
          onToken={(token) => this.onToken(token)}>
          { this.renderContent(false) }
        </Components.Stripe>;
      }
      return this.renderContent(true);
    }

    renderContent(useOnClick=false) {
      var planInfo: JSX.Element;
      var pricing: string|JSX.Element;
      if (this.props.planid === "Basic_20161019") {
        planInfo = <ul>
          { _.map(Text.BasicPlanFeatures, (feature, i) =>
              <li key={this.getId(`basic-feat-${i}`)}>{feature}</li>)}
        </ul>;
        pricing = Text.BasicPlanPrice;
      }
      else if (this.props.planid === "Executive_20161019") {
        planInfo = <ul>
          { _.map(Text.AdvancedPlanFeatures, (feature, i) =>
              <li key={this.getId(`advanced-feat-${i}`)}>{feature}</li>)}
        </ul>;
        pricing = Text.AdvancedPlanPrice;

        // TODO: This is a hack. We should fix this later and implement
        // proper coupon-entering.
        let showDiscount = _.includes(location.href, "coupon");
        if (showDiscount) {
          pricing = <span>
            <span className="old-price">{ Text.AdvancedPlanPrice }</span>
            <span>{ Text.AdvancedDiscountPlanPrice }</span>
          </span>
        }
      }

      let selected = this.props.subscription.plan === this.props.planid;
      return <div className={classNames("sub-plan-box", {selected})}
                  onClick={(e) => useOnClick ? this.changePlan() : null}>
        <h4 className="sub-plan-heading">
          { Text.getPlanName(this.props.planid) }
        </h4>
        <div className="sub-plan-body">
          <div className="free-trial">{Text.FreeTrialMsg}</div>
          <div className="pricing">{ pricing }</div>
          { planInfo }
        </div>
        <div className="sub-plan-footer">
          {
            this.state.busy ?
            <span><span className="esper-spinner" /></span> :
            <button className={classNames("btn form-control", {
              "btn-success": !selected,
              "btn-default": selected
            })} disabled={selected}>
              { selected ? Text.ActivePlan :
              ( this.props.subscription.plan ?
                Text.SelectPlan : Text.StartPlan )}
            </button>
          }
        </div>
      </div>;
    }
  }
}
