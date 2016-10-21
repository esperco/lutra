
module Esper.Views {
  interface Props {
    subscription: ApiT.TeamSubscription;
  }

  export class PaymentInfo extends ReactHelpers.Component<Props, {}> {
    render() {
      return <div className="esper-section">
        <div className="esper-section">
          <div className="alert alert-info">
            { Text.PaymentDescription }
          </div>
        </div>
        <div className="esper-section">
          <Components.Plans subscription={this.props.subscription}
            redirectTarget={Paths.Time.charts()} />
        </div>
      </div>;
    }
  }
}
