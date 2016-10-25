/*
  A modal to inform the user to upgrade their plan.
*/

module Esper.Components {
  interface Props {
    subscription: ApiT.SubscriptionDetails;
    busy: boolean;
  }

  export class PlanUpgradeModal extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Modal title="Upgrade Your Plan" icon="fa-arrow-up">
        <div className="esper-section">
          <div className="alert alert-warning">
            { Text.PlanUpgradeText }
          </div>
          { this.props.busy ?
            <div className="esper-spinner" /> :
            <Plans subscription={this.props.subscription}
                   redirectTarget={Paths.Manage.Team.pay()} />
          }
        </div>
      </Modal>;
    }
  }
}
