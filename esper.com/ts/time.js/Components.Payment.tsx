/*
  Modal for entering credit card information
*/

module Esper.Components {
  interface Props {
    error?: boolean;
    subscription: ApiT.TeamSubscription;
  }

  export class PaymentModal extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Modal icon="fa-credit-card" title="Payment" fixed>
        <div className="modal-body">
          <div className="esper-section">
            <div className="alert alert-info">
              { Text.PaymentDescription }
            </div>
            { this.props.error ? <ErrorMsg /> : null }
          </div>
          <div className="esper-section">
            <Components.Plans subscription={this.props.subscription} />
          </div>
        </div>
      </Modal>;
    }
  }
}
