/*
  Component for displaying plan information
*/

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
      this.props.onSelect(plan)
        .fail(() => this.mutateState((s) => s.busy = false));
    }
  }


  function PlanInfo({plan, subscription} : {
    plan: Types.PlanDetails;
    subscription: ApiT.SubscriptionDetails|ApiT.TeamSubscription;
  }) {
    let selected = subscription.plan === plan.id;

    // TODO: This is a hack. We should fix this later and implement
    // proper coupon-entering.
    let showDiscount = plan.discountedPrice &&
      _.includes(location.href, "coupon");
    let pricing = showDiscount ? <span>
      <span className="old-price">{ plan.price }</span>
      <span>{ plan.discountedPrice }</span>
    </span> : <span>{ plan.price }</span>;

    let canStartFreeTrial = plan.freeTrial &&
        !subscription.plan &&
        subscription.status !== "Past_due" &&
        subscription.status !== "Unpaid" &&
        subscription.status !== "Canceled";

    return <div className={classNames("sub-plan-box", {selected})}>
      <h4 className="sub-plan-heading">
        { plan.name }
      </h4>
      <div className="sub-plan-body">
        <div className="pricing">
          { plan.freeTrial ?
            <div className="free-trial">{ plan.freeTrial }</div> : null }
          { pricing }
        </div>
        <ul className="features">
          { _.map(plan.features, (f, i) => <li key={i}>
            { f }
          </li>) }
        </ul>
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
