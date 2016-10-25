
module Esper.Views {
  interface Props {
    teamId: string;
  }

  export class PaymentInfo extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      let team = Stores.Teams.require(this.props.teamId);
      let subscription = team.team_api.team_subscription;
      let subBusy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });
      let custBusy = !Stores.Customers.ready();
      if (subBusy || custBusy) {
        return <div className="esper-spinner" />;
      }

      let details = Stores.Subscriptions.get(subscription.cusid)
        .unwrapOr(null);

      return <div className="container">
        <div className="alert msg alert-info">
          { Text.PaymentDescription }
        </div>
        <Components.PaymentInfo
          team={team}
          customers={Stores.Customers.all()}
          details={details}
          redirect={Paths.Time.charts()}
        />
      </div>;
    }
  }
}
