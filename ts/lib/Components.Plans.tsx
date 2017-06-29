/*
  Component for displaying plan information
*/

/// <reference path="./Redeem.tsx" />
/// <reference path="./Text.tsx" />
/// <reference path="./Types.ts" />

module Esper.Components {
  interface Props {
    subscription: ApiT.TeamSubscription|ApiT.SubscriptionDetails;

    // Which plans to show
    plans: Types.PlanDetails[];

    // Callback promise
    onSelect: (plan: Types.PlanDetails) => JQueryPromise<any>;
  }

  interface State {
    busy: boolean;
  }

  export class Plans extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { busy: false };
    }

    render() {
      if (this.state.busy)
        return <div className="esper-spinner" />;

      let subscription = this.props.subscription;
      return <div className="esper-flex-list esper-section">
        { _.map(this.props.plans, (plan) =>
          <div key={plan.id} className="esper-section">
            <div onClick={() => this.onClick(plan)}>
              <PlanInfo {...{plan, subscription}} />
            </div>
          </div>) }
      </div>;
    }

    onClick(plan: Types.PlanDetails) {
      this.mutateState((s) => s.busy = true);
      let cusId = this.props.subscription.cusid;
      if (plan.enterprise) Api.sendSupportEmail(
        `${Login.myEmail()} has indicated interest in groups.`);
      this.props.onSelect(plan)
        .always(() => this.mutateState((s) => s.busy = false));
    }
  }


  function PlanInfo({plan, subscription} : {
    plan: Types.PlanDetails;
    subscription: ApiT.SubscriptionDetails|ApiT.TeamSubscription;
  }) {
    let selected = subscription.plan === plan.id;
    let showDiscount = plan.discountedPrice && Redeem.checkDiscount();
    let pricing = showDiscount ? <span>
      <span className="old-price">{ plan.price }</span>
      <span>{ plan.discountedPrice }</span>
    </span> : <span>{ plan.price }</span>;

    let canStartFreeTrial = plan.freeTrial &&
        !subscription.plan &&
        subscription.status !== "Past_due" &&
        subscription.status !== "Unpaid" &&
        subscription.status !== "Canceled";

    let trialText = (plan.extendedTrial && Redeem.checkExtendedTrial()) ?
      plan.extendedTrial : plan.freeTrial;

    return <div className={classNames("sub-plan-box", {selected})}>
      <h4 className="sub-plan-heading">
        { plan.name }
      </h4>
      <div className="sub-plan-body">
        <div className="pricing">
          { trialText ?
            <div className="free-trial">{ trialText }</div> : null }
          { pricing }
        </div>
        <ul className="features">
          { _.map(plan.features, (f, i) => <li key={i}>
            { f }
          </li>) }
        </ul>
        { plan.enterprise ?
          <p className="sub-enterprise-subtext">AND MORE...</p> : null
        }
      </div>
      <div className="sub-plan-footer">
        <button className="btn form-control btn-success">
          { selected ? Text.ActivePlan :
          ( canStartFreeTrial ? Text.StartFreeTrial : Text.SelectPlan )}
        </button>
      </div>

    </div>;
  }
}
