/*
  General settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerAccountsSettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.accounts;

    renderMain(cust: ApiT.Customer) {
      let teams = Stores.Teams.all();
      return <div>
        <SeatRequestList cust={cust} teams={teams} />
        <SeatList cust={cust} teams={teams} />
        <DomainFilterInput cust={cust} />
      </div>;
    }
  }

  function SeatList(props: {
    cust: ApiT.Customer,
    teams: ApiT.Team[]
  }) {
    return <div className="panel panel-default">
      <div className="panel-heading">{ Text.CustomerSeatHeading }</div>
      <div className="panel-body">
        <div className="list-group">
          { _.map(props.cust.seats,
            (seat) => <Seat key={seat.teamid} seat={seat} {...props} />
          )}
        </div>
      </div>
    </div>;
  }

  function Seat({cust, teams, seat}: {
    cust: ApiT.Customer,
    teams: ApiT.Team[],
    seat: ApiT.CustomerSeat
  }) {
    return <div className="list-group-item">
      <i className="fa fa-fw fa-left fa-user" />
      { seatDisplay(seat, teams) }
      <span className="pull-right action rm-action" title="Remove"
          onClick={() => Actions.Customers.rejectSeat(cust.id, seat.teamid)}>
        <i className="fa fa-fw fa-close" />
      </span>
    </div>;
  }

  function seatDisplay(seat: ApiT.CustomerSeat, teams: ApiT.Team[]) {
    let team = _.find(teams, (t) => t.teamid === seat.teamid);
    return team ? team.team_name : seat.email;
  }


  ///////

  function SeatRequestList(props: {
    cust: ApiT.Customer,
    teams: ApiT.Team[]
  }) {
    if (_.isEmpty(props.cust.seat_requests)) {
      return null;
    }

    return <div className="panel panel-default">
      <div className="panel-heading">
        { Text.CustomerPendingSeatHeading }
      </div>
      <div className="panel-body">
        <div className="list-group">
          { _.map(props.cust.seat_requests,
            (seat) => <SeatRequest key={seat.teamid} seat={seat} {...props} />
          )}
        </div>
      </div>
    </div>;
  }

  function SeatRequest({cust, teams, seat}: {
    cust: ApiT.Customer,
    teams: ApiT.Team[],
    seat: ApiT.CustomerSeat
  }) {
    return <div className="list-group-item">
      <i className="fa fa-fw fa-left fa-user" />
      { seatDisplay(seat, teams) }
      <span className="pull-right">
        <span className="action" title="Approve"
            onClick={() => Actions.Customers.acceptSeat(cust.id, seat.teamid)}>
          <i className="fa fa-fw fa-check" />
        </span>
        <span className="action rm-action" title="Reject"
            onClick={() => Actions.Customers.rejectSeat(cust.id, seat.teamid)}>
          <i className="fa fa-fw fa-close" />
        </span>
      </span>
    </div>;
  }


  ////

  class DomainFilterInput extends ReactHelpers.Component<{
    cust: ApiT.Customer
  }, {
    value: string;
    busy?: boolean;
    error?: boolean;
    success?: boolean;
  }> {
    _textarea: Components.TextArea;
    _timeout: number;

    constructor(props: {cust: ApiT.Customer}) {
      super(props);
      let domains = props.cust.filter.whitelist.domains;
      this.state = { value: domains.join(", ") };
    }

    componentWillReceiveProps(props: {cust: ApiT.Customer}) {
      if (props.cust.id !== this.props.cust.id) {
        // New customer -> reset state
        let domains = props.cust.filter.whitelist.domains;
        this.setState({ value: domains.join("") });
      }
    }

    render() {
      return <div className="panel panel-default">
        <div className="panel-heading">
          { Text.CustomerDomainHeading }
        </div>
        <div className="panel-body">
          <p className="description">
            { Text.CustomerDomainDescription }
          </p>
          <Components.TextArea
            className="form-control"
            placeholder="company.com, mail.company.com"
            value={this.state.value}
            onChange={(v) => this.onChange(v)}
          />
        </div>
        <Components.ModalPanelFooter
          busy={this.state.busy} error={this.state.error}
          success={this.state.success}
          okText="Save" onOK={() => this.onSubmit()}
          disableOK={this.state.busy}
        />
      </div>;
    }

    onChange(value: string) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(() => this.onSubmit(), 2000);
      this.setState({value, success: false, error: false });
    }

    onSubmit() {
      let domains = this.state.value.split(",");
      domains = _.map(domains, (d) => d.trim());
      this.mutateState((s) => {
        s.busy = true;
        s.error = false;
        s.success = false;
      });
      Actions.Customers
        .setDomainWhitelist(this.props.cust.id, domains)
        .then(
          () => this.mutateState((s) => {
            s.busy = false;
            s.success = true;
          }),
          () => this.mutateState((s) => {
            s.busy = false;
            s.error = true;
          })
        );
    }
  }
}
